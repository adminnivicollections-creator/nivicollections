import { getProductQuestions } from "@/lib/questions";
import { AskQuestionForm } from "./AskQuestionForm";

export async function QA({
  productId,
  slug,
}: {
  productId: string;
  slug: string;
}) {
  const questions = await getProductQuestions(productId);

  return (
    <section className="mt-28 border-t border-[#c59e5a]/20 pt-16">
      <h2 className="font-serif text-3xl font-light text-[#f3e6cc]">
        Questions & Answers
      </h2>

      <AskQuestionForm productId={productId} slug={slug} />

      {questions.length === 0 ? (
        <p className="mt-8 text-sm text-[#f3e6cc]/50">
          No questions yet. Ask us anything about this piece.
        </p>
      ) : (
        <ul className="mt-10 space-y-8">
          {questions.map((q) => (
            <li key={q.id} className="border-b border-[#c59e5a]/15 pb-8">
              <p className="text-sm text-[#f3e6cc]">
                <span className="text-[#c59e5a]">Q:</span> {q.question}
              </p>
              <p className="mt-1 text-xs text-[#f3e6cc]/40">
                {q.askerName} ·{" "}
                {new Date(q.created_at).toLocaleDateString("en-IN", {
                  month: "short",
                  year: "numeric",
                })}
              </p>
              {q.answer ? (
                <p className="mt-3 text-sm leading-relaxed text-[#f3e6cc]/80">
                  <span className="text-[#c59e5a]">A:</span> {q.answer.answer}
                </p>
              ) : (
                <p className="mt-3 text-xs italic text-[#f3e6cc]/40">
                  Not yet answered.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
