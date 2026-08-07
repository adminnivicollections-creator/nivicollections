"use client";

import { useActionState } from "react";
import { bulkUploadProducts } from "./actions";

export function BulkUploadForm() {
  const [state, formAction, pending] = useActionState(bulkUploadProducts, undefined);

  return (
    <form action={formAction} className="mt-6 max-w-xl">
      <input
        type="file"
        name="file"
        accept=".csv,text/csv"
        required
        className="text-sm file:mr-3 file:border file:border-ink/20 file:bg-transparent file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-[0.15em]"
      />
      <button
        type="submit"
        disabled={pending}
        className="mt-4 block border border-ink px-8 py-3 text-[11px] uppercase tracking-[0.2em] text-ink disabled:opacity-40"
      >
        {pending ? "Uploading…" : "Upload"}
      </button>

      {state && "error" in state && (
        <p className="mt-4 text-sm text-red-700">{state.error}</p>
      )}

      {state && "created" in state && (
        <div className="mt-6 border border-ink/10 p-4 text-sm">
          <p className="text-ink">
            {state.created} created, {state.updated} updated
            {state.errors.length > 0 && `, ${state.errors.length} skipped`}.
          </p>
          {state.errors.length > 0 && (
            <ul className="mt-3 space-y-1 text-red-700">
              {state.errors.map((e) => (
                <li key={e.row}>
                  Row {e.row}: {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
