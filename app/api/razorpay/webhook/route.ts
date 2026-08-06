import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { sendOrderConfirmation } from "@/lib/email";

// Razorpay is the authority on whether money moved, not the browser. The
// client-side success callback only navigates; this endpoint is what marks an
// order paid and reserves stock.
export async function POST(request: NextRequest) {
  const raw = await request.text();

  if (!verifyWebhookSignature(raw, request.headers.get("x-razorpay-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(raw);
  if (event.event !== "payment.captured") {
    return NextResponse.json({ ok: true, ignored: event.event });
  }

  const payment = event.payload?.payment?.entity;
  const razorpayOrderId: string | undefined = payment?.order_id;
  if (!razorpayOrderId) {
    return NextResponse.json({ error: "No order id" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Only move pending_payment -> paid. Razorpay retries webhooks, and this
  // makes a repeat delivery a no-op instead of decrementing stock twice.
  const { data: updated, error } = await admin
    .from("orders")
    .update({ status: "paid", razorpay_payment_id: payment.id })
    .eq("razorpay_order_id", razorpayOrderId)
    .eq("status", "pending_payment")
    .select("id, order_number, email, total_paise")
    .maybeSingle();

  if (error) {
    console.error("Webhook order update failed", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  if (!updated) {
    // Already processed, or an order we do not know about.
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const { error: stockError } = await admin.rpc("reserve_order_stock", {
    p_order_id: updated.id,
  });
  if (stockError) {
    // Payment succeeded but stock ran out: keep the money-state truthful and
    // flag it for a human rather than silently overselling.
    console.error(`Oversold on order ${updated.order_number}`, stockError);
  }

  try {
    await sendOrderConfirmation(updated.id);
  } catch (e) {
    // Never fail the webhook over email; Razorpay would retry the whole thing.
    console.error("Order confirmation email failed", e);
  }

  return NextResponse.json({ ok: true });
}
