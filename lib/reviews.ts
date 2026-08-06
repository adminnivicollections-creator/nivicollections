import "server-only";
import { createAdminClient } from "./supabase/admin";
import { createClient } from "./supabase/server";
import { getUserId } from "./auth";
import type { Review } from "./supabase/types";

export type ReviewWithReviewer = Review & { reviewerName: string };

export type ReviewSummary = { average: number; count: number };

// Reads with the admin client, not the RLS-scoped one: the reviews row
// itself is public, but a naive embedded join to `profiles` would silently
// return null for every reviewer except the current user, since profiles is
// owner-only. Only the first name is ever sent to the client.
export async function getProductReviews(
  productId: string,
): Promise<ReviewWithReviewer[]> {
  const { data, error } = await createAdminClient()
    .from("reviews")
    .select("*, profiles(full_name)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .overrideTypes<(Review & { profiles: { full_name: string } | null })[]>();

  if (error) throw error;

  return data.map(({ profiles, ...review }) => ({
    ...review,
    reviewerName: firstName(profiles?.full_name) ?? "Verified buyer",
  }));
}

export async function getReviewSummary(
  productId: string,
): Promise<ReviewSummary> {
  const { data, error } = await createAdminClient()
    .from("reviews")
    .select("rating")
    .eq("product_id", productId);

  if (error) throw error;
  if (data.length === 0) return { average: 0, count: 0 };

  const total = data.reduce((sum, r) => sum + r.rating, 0);
  return { average: total / data.length, count: data.length };
}

/**
 * Order items the signed-in user has bought, delivered, and not yet
 * reviewed for this product — i.e. what they're eligible to review right now.
 */
export async function getReviewableOrderItems(
  productId: string,
): Promise<{ id: string; orderNumber: string; deliveredAt: string | null }[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_items")
    .select("id, orders!inner(order_number, user_id, status, delivered_at)")
    .eq("product_id", productId)
    .eq("orders.user_id", userId)
    .eq("orders.status", "delivered")
    .overrideTypes<
      {
        id: string;
        orders: { order_number: string; delivered_at: string | null };
      }[]
    >();

  if (error) throw error;

  const { data: reviewed, error: reviewedError } = await supabase
    .from("reviews")
    .select("order_item_id")
    .in(
      "order_item_id",
      data.map((d) => d.id),
    );
  if (reviewedError) throw reviewedError;

  const reviewedIds = new Set(reviewed.map((r) => r.order_item_id));

  return data
    .filter((d) => !reviewedIds.has(d.id))
    .map((d) => ({
      id: d.id,
      orderNumber: d.orders.order_number,
      deliveredAt: d.orders.delivered_at,
    }));
}

function firstName(fullName: string | undefined | null): string | null {
  const first = fullName?.trim().split(/\s+/)[0];
  return first || null;
}
