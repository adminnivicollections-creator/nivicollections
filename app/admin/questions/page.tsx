import Link from "next/link";
import { getAllQuestions } from "@/lib/questions";
import { AnswerForm } from "./AnswerForm";

export const dynamic = "force-dynamic";

export default async function AdminQuestionsPage() {
  const questions = await getAllQuestions();
  const unanswered = questions.filter((q) => !q.answer);
  const answered = questions.filter((q) => q.answer);

  return (
    <div className="py-10">
      <h2 className="font-serif text-2xl font-light text-ink">
        Needs an answer ({unanswered.length})
      </h2>
      {unanswered.length === 0 ? (
        <p className="mt-4 text-ink/60">Nothing waiting on you.</p>
      ) : (
        <ul className="mt-6 space-y-8">
          {unanswered.map((q) => (
            <li key={q.id} className="border border-ink/10 p-5">
              <Link
                href={`/products/${q.productSlug}`}
                className="text-[11px] uppercase tracking-[0.2em] text-gold"
              >
                {q.productName}
              </Link>
              <p className="mt-2 text-sm text-ink">{q.question}</p>
              <p className="mt-1 text-xs text-ink/40">
                {q.askerName} ·{" "}
                {new Date(q.created_at).toLocaleDateString("en-IN")}
              </p>
              <AnswerForm questionId={q.id} />
            </li>
          ))}
        </ul>
      )}

      {answered.length > 0 && (
        <>
          <h2 className="mt-16 font-serif text-2xl font-light text-ink">
            Answered
          </h2>
          <ul className="mt-6 space-y-6">
            {answered.map((q) => (
              <li key={q.id} className="border-b border-ink/10 pb-6 text-sm">
                <p className="text-ink/70">
                  {q.productName} — {q.question}
                </p>
                <p className="mt-1 text-ink">{q.answer?.answer}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
