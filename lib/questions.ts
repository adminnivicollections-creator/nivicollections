import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { ProductQuestion, ProductAnswer } from "./supabase/types";

export type QuestionWithAnswer = ProductQuestion & {
  askerName: string;
  answer: ProductAnswer | null;
};

// product_answers.question_id references product_questions.id directly, so
// (unlike reviews -> profiles) PostgREST can embed this without a manual
// second query.
export async function getProductQuestions(
  productId: string,
): Promise<QuestionWithAnswer[]> {
  const admin = createAdminClient();
  const { data: questions, error } = await admin
    .from("product_questions")
    .select("*, product_answers(*)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .overrideTypes<(ProductQuestion & { product_answers: ProductAnswer[] })[]>();

  if (error) throw error;
  if (questions.length === 0) return [];

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", [...new Set(questions.map((q) => q.user_id))]);
  if (profilesError) throw profilesError;

  const nameById = new Map(profiles.map((p) => [p.id, p.full_name]));

  return questions.map(({ product_answers, ...q }) => ({
    ...q,
    askerName: firstName(nameById.get(q.user_id)) ?? "A shopper",
    answer: product_answers[0] ?? null,
  }));
}

export type AdminQuestion = QuestionWithAnswer & {
  productName: string;
  productSlug: string;
};

/** Every question across the catalogue, newest first, for the admin panel. */
export async function getAllQuestions(): Promise<AdminQuestion[]> {
  const admin = createAdminClient();
  const { data: questions, error } = await admin
    .from("product_questions")
    .select("*, product_answers(*), products(name, slug)")
    .order("created_at", { ascending: false })
    .overrideTypes<
      (ProductQuestion & {
        product_answers: ProductAnswer[];
        products: { name: string; slug: string } | null;
      })[]
    >();

  if (error) throw error;
  if (questions.length === 0) return [];

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", [...new Set(questions.map((q) => q.user_id))]);
  if (profilesError) throw profilesError;

  const nameById = new Map(profiles.map((p) => [p.id, p.full_name]));

  return questions.map(({ product_answers, products, ...q }) => ({
    ...q,
    askerName: firstName(nameById.get(q.user_id)) ?? "A shopper",
    answer: product_answers[0] ?? null,
    productName: products?.name ?? "Deleted product",
    productSlug: products?.slug ?? "",
  }));
}

function firstName(fullName: string | undefined | null): string | null {
  const first = fullName?.trim().split(/\s+/)[0];
  return first || null;
}
