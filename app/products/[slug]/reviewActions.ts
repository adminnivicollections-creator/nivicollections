"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/auth";

export type ReviewActionResult = { error: string } | { ok: true } | undefined;

const schema = z.object({
  orderItemId: z.uuid(),
  productId: z.uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).default(""),
  body: z.string().trim().max(2000).default(""),
});

export async function submitReview(
  slug: string,
  _prev: ReviewActionResult,
  formData: FormData,
): Promise<ReviewActionResult> {
  const userId = await getUserId();
  if (!userId) return { error: "Sign in to write a review." };

  const parsed = schema.safeParse({
    orderItemId: formData.get("orderItemId"),
    productId: formData.get("productId"),
    rating: formData.get("rating"),
    title: formData.get("title") ?? "",
    body: formData.get("body") ?? "",
  });
  if (!parsed.success) return { error: z.prettifyError(parsed.error) };

  const supabase = await createClient();
  // RLS re-verifies the delivered-purchase requirement itself; this insert
  // is not the only thing standing between a stranger and a fake review.
  const { error } = await supabase.from("reviews").insert({
    user_id: userId,
    order_item_id: parsed.data.orderItemId,
    product_id: parsed.data.productId,
    rating: parsed.data.rating,
    title: parsed.data.title,
    body: parsed.data.body,
  });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "You have already reviewed this purchase."
          : "Could not save your review. Please try again.",
    };
  }

  revalidatePath(`/products/${slug}`);
  return { ok: true };
}
