"use client";

import { useActionState } from "react";
import { askQuestion } from "./questionActions";

export function AskQuestionForm({
  productId,
  slug,
}: {
  productId: string;
  slug: string;
}) {
  const action = askQuestion.bind(null, slug);
  const [state, formAction, pending] = useActionState(action, undefined);

  if (state && "ok" in state) {
    return (
      <p className="mt-8 border border-[#c59e5a]/40 bg-[#c59e5a]/10 px-5 py-4 text-sm text-[#f3e6cc]">
        Thank you — we will answer here shortly.
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-3 sm:flex-row">
      <input type="hidden" name="productId" value={productId} />
      <label htmlFor="question" className="sr-only">
        Ask a question
      </label>
      <input
        id="question"
        name="question"
        required
        minLength={3}
        maxLength={500}
        placeholder="Ask a question about this piece…"
        className="flex-1 border border-[#c59e5a]/30 bg-transparent px-4 py-3 text-sm text-[#f3e6cc] outline-none placeholder:text-[#f3e6cc]/30 focus:border-[#c59e5a]"
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 bg-[#c59e5a] px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-[#0b0906] disabled:opacity-40"
      >
        {pending ? "…" : "Ask"}
      </button>
      {state && "error" in state && (
        <p className="text-sm text-red-400 sm:w-full">{state.error}</p>
      )}
    </form>
  );
}
