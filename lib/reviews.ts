import "server-only";
import { createAdminClient } from "./supabase/admin";
import { createClient } from "./supabase/server";
import { getUserId } from "./auth";
import type { Review } from "./supabase/types";

export type ReviewWithReviewer = Review & { reviewerName: string };

export type ReviewSummary = { average: number; count: number };

// Reads with the admin client, not the RLS-scoped one: the reviews row
// itself is public, but reading another user's profile row is not, since
// profiles is owner-only. Fetched as two queries rather than an embed:
// reviews.user_id and profiles.id both reference auth.users independently,
// with no FK directly between them, so PostgREST cannot auto-join the two.
// Only the first name is ever sent to the client.
//
// The admin client bypasses RLS entirely, so the approved-only filter has to
// be explicit here — the "approved reviews are publicly readable" policy
// gives no protection to a query running as the service role.
export async function getProductReviews(
  productId: string,
): Promise<ReviewWithReviewer[]> {
  const admin = createAdminClient();
  const { data: reviews, error } = await admin
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (reviews.length === 0) return [];

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", [...new Set(reviews.map((r) => r.user_id))]);
  if (profilesError) throw profilesError;

  const nameById = new Map(profiles.map((p) => [p.id, p.full_name]));

  return reviews.map((review) => ({
    ...review,
    reviewerName: firstName(nameById.get(review.user_id)) ?? "Verified buyer",
  }));
}

export async function getReviewSummary(
  productId: string,
): Promise<ReviewSummary> {
  const { data, error } = await createAdminClient()
    .from("reviews")
    .select("rating")
    .eq("product_id", productId)
    .eq("status", "approved");

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

export type AdminReview = ReviewWithReviewer & {
  productName: string;
  productSlug: string;
};

/** Every review across the catalogue, newest first, for the moderation queue. */
export async function getAllReviews(): Promise<AdminReview[]> {
  const admin = createAdminClient();
  const { data: reviews, error } = await admin
    .from("reviews")
    .select("*, products(name, slug)")
    .order("created_at", { ascending: false })
    .overrideTypes<(Review & { products: { name: string; slug: string } | null })[]>();

  if (error) throw error;
  if (reviews.length === 0) return [];

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", [...new Set(reviews.map((r) => r.user_id))]);
  if (profilesError) throw profilesError;

  const nameById = new Map(profiles.map((p) => [p.id, p.full_name]));

  return reviews.map(({ products, ...review }) => ({
    ...review,
    reviewerName: firstName(nameById.get(review.user_id)) ?? "Verified buyer",
    productName: products?.name ?? "Deleted product",
    productSlug: products?.slug ?? "",
  }));
}

function firstName(fullName: string | undefined | null): string | null {
  const first = fullName?.trim().split(/\s+/)[0];
  return first || null;
}
