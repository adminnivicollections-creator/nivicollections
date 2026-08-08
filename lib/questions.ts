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
    answer: product_answers?.[0] ?? null,
  }));
}

export type AdminQuestion = QuestionWithAnswer & {
  productName: string;
  productSlug: string;
};

type RawAdminQuestion = ProductQuestion & {
  product_answers: ProductAnswer[];
  products: { name: string; slug: string } | null;
};

async function hydrateAdminQuestions(
  admin: ReturnType<typeof createAdminClient>,
  questions: RawAdminQuestion[],
): Promise<AdminQuestion[]> {
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
    answer: product_answers?.[0] ?? null,
    productName: products?.name ?? "Deleted product",
    productSlug: products?.slug ?? "",
  }));
}

// ponytail: PostgREST has no cheap "has no related row" filter without a
// view or RPC, so unlike getAnsweredQuestions below, this can't push a real
// filter to SQL — it fetches a bounded window and filters in JS instead.
// This queue self-limits in practice (admins clear it out), so 500 is a
// generous ceiling; if it's ever not enough, add a NOT EXISTS-backed view.
const UNANSWERED_FETCH_CEILING = 500;

/** Unanswered questions across the catalogue, newest first. */
export async function getUnansweredQuestions(): Promise<AdminQuestion[]> {
  const admin = createAdminClient();
  const { data: questions, error } = await admin
    .from("product_questions")
    .select("*, product_answers(*), products(name, slug)")
    .order("created_at", { ascending: false })
    .limit(UNANSWERED_FETCH_CEILING)
    .overrideTypes<RawAdminQuestion[]>();

  if (error) throw error;
  const unanswered = questions.filter((q) => (q.product_answers?.length ?? 0) === 0);
  return hydrateAdminQuestions(admin, unanswered);
}

/** Already-answered questions, paginated — this one genuinely grows without bound. */
export async function getAnsweredQuestions(
  page: number,
  pageSize: number,
): Promise<{ questions: AdminQuestion[]; total: number }> {
  const admin = createAdminClient();
  const from = (page - 1) * pageSize;

  // !inner requires a matching product_answers row to exist, which is what
  // makes this filterable and countable at the SQL level, unlike "unanswered".
  const { data: questions, error, count } = await admin
    .from("product_questions")
    .select("*, product_answers!inner(*), products(name, slug)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1)
    .overrideTypes<RawAdminQuestion[]>();

  if (error) throw error;
  return { questions: await hydrateAdminQuestions(admin, questions), total: count ?? 0 };
}

function firstName(fullName: string | undefined | null): string | null {
  const first = fullName?.trim().split(/\s+/)[0];
  return first || null;
}
