import "server-only";
import type { Order, StoreSettings } from "./supabase/types";

/** Same rule the policy pages state: delivered, and within the return window. */
export function isReturnEligible(
  order: Pick<Order, "status" | "delivered_at">,
  settings: Pick<StoreSettings, "return_window_days">,
): boolean {
  if (order.status !== "delivered" || !order.delivered_at) return false;
  const deliveredAt = new Date(order.delivered_at).getTime();
  const windowMs = settings.return_window_days * 24 * 60 * 60 * 1000;
  return Date.now() - deliveredAt <= windowMs;
}
