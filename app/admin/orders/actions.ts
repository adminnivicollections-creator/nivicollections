"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { sendShippingNotice } from "@/lib/email";
import { createRazorpayRefund } from "@/lib/razorpay";
import { formatINR } from "@/lib/config";
import type { OrderStatus } from "@/lib/supabase/types";

export type ActionResult = { error: string } | { ok: true } | undefined;

// Which transitions are allowed. Stops a delivered order being flipped back to
// pending, and stops anything leaving a terminal state by accident.
// "refunded" is deliberately unreachable here — it is only ever set by
// refundOrder() below, after Razorpay has actually moved money. Letting an
// admin pick it from this dropdown would make "refunded" a lie.
const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["cancelled"],
  paid: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  refunded: [],
};

const schema = z.object({
  status: z.enum([
    "pending_payment",
    "paid",
    "packed",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  carrier: z.string().trim().max(80).default(""),
  trackingNumber: z.string().trim().max(80).default(""),
  adminNote: z.string().trim().max(2000).default(""),
});

export async function updateOrder(
  orderId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = schema.safeParse({
    status: formData.get("status"),
    carrier: formData.get("carrier") ?? "",
    trackingNumber: formData.get("trackingNumber") ?? "",
    adminNote: formData.get("adminNote") ?? "",
  });
  if (!parsed.success) return { error: z.prettifyError(parsed.error) };

  const { status, carrier, trackingNumber, adminNote } = parsed.data;
  const admin = createAdminClient();

  const { data: order, error: findError } = await admin
    .from("orders")
    .select("id, status, order_number")
    .eq("id", orderId)
    .maybeSingle();

  if (findError) return { error: findError.message };
  if (!order) return { error: "Order not found." };

  const changingStatus = status !== order.status;
  if (changingStatus && !NEXT_STATUS[order.status].includes(status)) {
    return {
      error: `Cannot move an order from "${order.status.replace("_", " ")}" to "${status}".`,
    };
  }
  if (status === "shipped" && !trackingNumber) {
    return { error: "Add a tracking number before marking an order shipped." };
  }

  const { data: updatedRows, error } = await admin
    .from("orders")
    .update({
      status,
      carrier,
      tracking_number: trackingNumber,
      admin_note: adminNote,
      ...(status === "shipped" && { shipped_at: new Date().toISOString() }),
      ...(status === "delivered" && { delivered_at: new Date().toISOString() }),
    })
    .eq("id", orderId)
    // Only write if the row still looks the way we checked it, so two admins
    // editing at once cannot skip a transition.
    .eq("status", order.status)
    .select("id");

  if (error) return { error: error.message };
  // A matched-zero-rows update returns no error — it just silently does
  // nothing. Without this check, a losing admin in a race would see "saved"
  // and, worse, still send a "shipped" email below for a status that never
  // actually changed.
  if (!updatedRows || updatedRows.length === 0) {
    return {
      error: "This order was changed by someone else. Refresh and try again.",
    };
  }

  if (changingStatus && status === "shipped") {
    try {
      await sendShippingNotice(orderId);
    } catch (e) {
      console.error("Shipping email failed", e);
      // The status change already succeeded; say so rather than implying it did not.
      return { error: "Order marked shipped, but the email failed to send." };
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account");
  return { ok: true };
}

const refundSchema = z.object({
  amountRupees: z.coerce.number().min(1),
  reason: z.string().trim().max(500).default(""),
});

export async function refundOrder(
  orderId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = refundSchema.safeParse({
    amountRupees: formData.get("amountRupees"),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) return { error: z.prettifyError(parsed.error) };
  const amountPaise = Math.round(parsed.data.amountRupees * 100);

  const admin = createAdminClient();

  const { data: order, error: findError } = await admin
    .from("orders")
    .select("id, order_number, status, total_paise, razorpay_payment_id")
    .eq("id", orderId)
    .maybeSingle();
  if (findError) return { error: findError.message };
  if (!order) return { error: "Order not found." };
  if (!order.razorpay_payment_id) {
    return { error: "This order was never paid — there is nothing to refund." };
  }
  if (order.status === "cancelled" || order.status === "pending_payment") {
    return {
      error: `Cannot refund an order that is "${order.status.replace("_", " ")}".`,
    };
  }

  const { data: existingRefunds, error: refundsError } = await admin
    .from("refunds")
    .select("amount_paise")
    .eq("order_id", orderId);
  if (refundsError) return { error: refundsError.message };

  const alreadyRefunded = (existingRefunds ?? []).reduce(
    (sum, r) => sum + r.amount_paise,
    0,
  );
  const remaining = order.total_paise - alreadyRefunded;
  if (amountPaise > remaining) {
    return { error: `Only ${formatINR(remaining)} is left to refund on this order.` };
  }

  let refund;
  try {
    refund = await createRazorpayRefund({
      paymentId: order.razorpay_payment_id,
      amountPaise,
      notes: { order_id: order.id, order_number: order.order_number },
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Refund failed." };
  }

  const { error: insertError } = await admin.from("refunds").insert({
    order_id: order.id,
    razorpay_refund_id: refund.id,
    amount_paise: amountPaise,
    reason: parsed.data.reason,
  });
  if (insertError) {
    // The money has already moved at Razorpay by this point — this is not a
    // failed refund, it's a failed record of a successful one. Reporting it
    // as "refund failed" would risk an admin trying again and double-refunding.
    console.error(
      `Refund ${refund.id} succeeded at Razorpay but failed to record`,
      insertError,
    );
    return {
      error: `Refunded ${formatINR(amountPaise)} successfully, but saving the record failed (${insertError.message}). Razorpay refund id: ${refund.id} — note this down.`,
    };
  }

  if (alreadyRefunded + amountPaise >= order.total_paise) {
    await admin.from("orders").update({ status: "refunded" }).eq("id", orderId);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account");
  return { ok: true };
}
