"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

export type ActionResult = { error: string } | undefined;

const schema = z.object({
  questionId: z.uuid(),
  answer: z.string().trim().min(1).max(2000),
});

export async function answerQuestion(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = schema.safeParse({
    questionId: formData.get("questionId"),
    answer: formData.get("answer"),
  });
  if (!parsed.success) return { error: z.prettifyError(parsed.error) };

  const { error } = await createAdminClient()
    .from("product_answers")
    .insert({
      question_id: parsed.data.questionId,
      answer: parsed.data.answer,
    });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "This question already has an answer."
          : error.message,
    };
  }

  revalidatePath("/admin/questions");
  return undefined;
}
