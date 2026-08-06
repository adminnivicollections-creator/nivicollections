"use client";

import { useActionState } from "react";
import { answerQuestion } from "./actions";

export function AnswerForm({ questionId }: { questionId: string }) {
  const [state, formAction, pending] = useActionState(answerQuestion, undefined);

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
      <input type="hidden" name="questionId" value={questionId} />
      <label htmlFor={`answer-${questionId}`} className="sr-only">
        Your answer
      </label>
      <input
        id={`answer-${questionId}`}
        name="answer"
        required
        maxLength={2000}
        placeholder="Write your answer…"
        className="flex-1 border border-ink/20 bg-transparent px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 bg-ink px-6 py-2 text-[11px] uppercase tracking-[0.15em] text-cream disabled:opacity-40"
      >
        {pending ? "…" : "Post answer"}
      </button>
      {state?.error && (
        <p className="text-xs text-red-700 sm:w-full">{state.error}</p>
      )}
    </form>
  );
}
