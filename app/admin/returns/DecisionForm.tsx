"use client";

import { useActionState, useState } from "react";
import type { ActionResult } from "./actions";

export function DecisionForm({
  approveAction,
  rejectAction,
}: {
  approveAction: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  rejectAction: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
}) {
  const [note, setNote] = useState("");
  const [approveState, approveFormAction, approvePending] = useActionState(
    approveAction,
    undefined,
  );
  const [rejectState, rejectFormAction, rejectPending] = useActionState(
    rejectAction,
    undefined,
  );

  return (
    <div className="mt-4">
      <label className="sr-only">Note (shown to the customer if rejected)</label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Note — required if rejecting, optional if approving"
        className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
      />
      <div className="mt-3 flex gap-4">
        <form action={approveFormAction}>
          <input type="hidden" name="adminNote" value={note} />
          <button
            type="submit"
            disabled={approvePending || rejectPending}
            className="text-xs uppercase tracking-[0.15em] text-gold disabled:opacity-40"
          >
            Approve
          </button>
        </form>
        <form action={rejectFormAction}>
          <input type="hidden" name="adminNote" value={note} />
          <button
            type="submit"
            disabled={approvePending || rejectPending}
            className="text-xs uppercase tracking-[0.15em] text-red-700 disabled:opacity-40"
          >
            Reject
          </button>
        </form>
      </div>
      {(approveState?.error || rejectState?.error) && (
        <p className="mt-2 text-xs text-red-700">
          {approveState?.error ?? rejectState?.error}
        </p>
      )}
    </div>
  );
}
