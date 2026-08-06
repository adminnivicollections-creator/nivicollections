"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";
import { getUserId } from "./auth";

export async function getWishlistProductIds(): Promise<Set<string>> {
  const userId = await getUserId();
  if (!userId) return new Set();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wishlists")
    .select("product_id")
    .eq("user_id", userId);

  if (error) throw error;
  return new Set(data.map((w) => w.product_id));
}

export async function toggleWishlist(
  productId: string,
  path: string,
): Promise<{ error: string } | { wishlisted: boolean }> {
  const userId = await getUserId();
  if (!userId) return { error: "Sign in to save pieces to your wishlist." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("id", existing.id);
    if (error) return { error: error.message };
    revalidatePath(path);
    revalidatePath("/account/wishlist");
    return { wishlisted: false };
  }

  const { error } = await supabase
    .from("wishlists")
    .insert({ user_id: userId, product_id: productId });
  if (error) return { error: error.message };
  revalidatePath(path);
  revalidatePath("/account/wishlist");
  return { wishlisted: true };
}
