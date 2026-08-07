"use client";

import { useActionState } from "react";
import type { ActionResult } from "../actions";

const REASONS = [
  { value: "defective", label: "Item arrived defective or damaged" },
  { value: "wrong_item", label: "I received the wrong item" },
  { value: "changed_mind", label: "I changed my mind" },
  { value: "other", label: "Other" },
];

export function ReturnRequestForm({
  action,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const field =
    "mt-1 w-full border border-[#c59e5a]/30 bg-transparent px-4 py-3 text-sm text-[#f3e6cc] outline-none focus:border-[#c59e5a]";
  const label = "text-[11px] uppercase tracking-[0.2em] text-[#f3e6cc]/60";

  return (
    <form action={formAction} className="mt-8 max-w-xl space-y-5">
      <div>
        <label htmlFor="reason" className={label}>
          Reason
        </label>
        <select id="reason" name="reason" required className={field}>
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className={label}>
          Tell us more
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={1000}
          placeholder="What happened?"
          className={field}
        />
      </div>

      <div>
        <label htmlFor="photos" className={label}>
          Photos (optional, up to 4)
        </label>
        <input
          id="photos"
          name="photos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="mt-1 block w-full text-sm text-[#f3e6cc]/70 file:mr-3 file:border file:border-[#c59e5a]/40 file:bg-transparent file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-[0.15em] file:text-[#f3e6cc]"
        />
        <p className="mt-1 text-xs text-[#f3e6cc]/40">
          Helpful for defective or wrong-item claims — JPEG, PNG or WebP, up to 5MB each.
        </p>
      </div>

      {state?.error && (
        <p className="whitespace-pre-line text-sm text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-[#c59e5a] px-10 py-4 text-[11px] uppercase tracking-[0.25em] text-[#0b0906] disabled:opacity-40"
      >
        {pending ? "Submitting…" : "Submit return request"}
      </button>
    </form>
  );
}
