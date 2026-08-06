import "server-only";
import { createAdminClient } from "./supabase/admin";
import { getProductsByIds, type ProductWithMedia } from "./catalog";
import type { OrderStatus } from "./supabase/types";

// Orders/order_items are owner-only under RLS — the request-scoped client
// would only ever see the current shopper's own history. This needs the
// service-role client to aggregate across every customer, but it only ever
// returns derived product recommendations, never raw order or customer data.
const COMPLETED_STATUSES: OrderStatus[] = ["paid", "packed", "shipped", "delivered"];

/**
 * Products actually purchased alongside this one, ranked by how often.
 * Returns nothing until there is real co-purchase data — no seeded or
 * fabricated pairing.
 */
export async function getFrequentlyBoughtWith(
  productId: string,
  limit = 4,
): Promise<ProductWithMedia[]> {
  const admin = createAdminClient();

  const { data: myItems, error } = await admin
    .from("order_items")
    .select("order_id, orders!inner(status)")
    .eq("product_id", productId)
    .in("orders.status", COMPLETED_STATUSES);
  if (error) throw error;

  const orderIds = [...new Set(myItems.map((i) => i.order_id))];
  if (orderIds.length === 0) return [];

  const { data: coItems, error: coError } = await admin
    .from("order_items")
    .select("product_id")
    .in("order_id", orderIds)
    .neq("product_id", productId);
  if (coError) throw coError;

  const counts = new Map<string, number>();
  for (const item of coItems) {
    if (!item.product_id) continue;
    counts.set(item.product_id, (counts.get(item.product_id) ?? 0) + 1);
  }

  const topIds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  return getProductsByIds(topIds);
}
