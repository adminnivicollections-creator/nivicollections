"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import type { ReviewStatus } from "@/lib/supabase/types";

export async function setReviewStatus(
  reviewId: string,
  status: ReviewStatus,
): Promise<void> {
  await requireAdmin();
  const { error } = await createAdminClient()
    .from("reviews")
    .update({ status })
    .eq("id", reviewId);
  if (error) throw error;

  revalidatePath("/admin/reviews");
  revalidatePath("/products", "layout");
}

export type ActionResult = { error: string } | undefined;

const replySchema = z.object({
  reply: z.string().trim().max(1000),
});

export async function replyToReview(
  reviewId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = replySchema.safeParse({ reply: formData.get("reply") });
  if (!parsed.success) return { error: z.prettifyError(parsed.error) };

  const { error } = await createAdminClient()
    .from("reviews")
    .update({ admin_reply: parsed.data.reply || null })
    .eq("id", reviewId);
  if (error) return { error: error.message };

  revalidatePath("/admin/reviews");
  revalidatePath("/products", "layout");
  return undefined;
}
