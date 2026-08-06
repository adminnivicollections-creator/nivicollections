"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/auth";

export type AskResult = { error: string } | { ok: true } | undefined;

const schema = z.object({
  productId: z.uuid(),
  question: z.string().trim().min(3).max(500),
});

export async function askQuestion(
  slug: string,
  _prev: AskResult,
  formData: FormData,
): Promise<AskResult> {
  const userId = await getUserId();
  if (!userId) return { error: "Sign in to ask a question." };

  const parsed = schema.safeParse({
    productId: formData.get("productId"),
    question: formData.get("question"),
  });
  if (!parsed.success) return { error: z.prettifyError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("product_questions").insert({
    user_id: userId,
    product_id: parsed.data.productId,
    question: parsed.data.question,
  });
  if (error) return { error: "Could not post your question. Please try again." };

  revalidatePath(`/products/${slug}`);
  return { ok: true };
}
