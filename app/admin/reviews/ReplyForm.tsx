"use client";

import { useActionState } from "react";
import type { ActionResult } from "./actions";

export function ReplyForm({
  action,
  defaultValue,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  defaultValue: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
      <label className="sr-only">Store reply</label>
      <input
        name="reply"
        defaultValue={defaultValue}
        maxLength={1000}
        placeholder="Reply as Nivi Collections (optional)…"
        className="flex-1 border border-ink/20 bg-transparent px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 bg-ink px-6 py-2 text-[11px] uppercase tracking-[0.15em] text-cream disabled:opacity-40"
      >
        {pending ? "…" : "Save reply"}
      </button>
      {state?.error && (
        <p className="text-xs text-red-700 sm:w-full">{state.error}</p>
      )}
    </form>
  );
}
