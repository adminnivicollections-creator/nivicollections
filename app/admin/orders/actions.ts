"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { sendShippingNotice } from "@/lib/email";
import type { OrderStatus } from "@/lib/supabase/types";

export type ActionResult = { error: string } | { ok: true } | undefined;

// Which transitions are allowed. Stops a delivered order being flipped back to
// pending, and stops anything leaving a terminal state by accident.
const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["cancelled"],
  paid: ["packed", "cancelled", "refunded"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["refunded"],
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

  const { error } = await admin
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
    .eq("status", order.status);

  if (error) return { error: error.message };

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
