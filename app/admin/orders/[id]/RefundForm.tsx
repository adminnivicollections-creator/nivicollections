"use client";

import { useActionState } from "react";
import { formatINR } from "@/lib/config";
import type { Refund } from "@/lib/supabase/types";
import type { ActionResult } from "../actions";

export function RefundForm({
  action,
  refundablePaise,
  refunds,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  refundablePaise: number;
  refunds: Refund[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const field =
    "mt-1 w-full border border-ink/20 bg-transparent px-4 py-3 text-sm outline-none focus:border-ink";
  const label = "text-[11px] uppercase tracking-[0.2em] text-ink/60";

  return (
    <div className="h-fit border border-ink/10 p-6">
      <h3 className={label}>Refund</h3>

      {refunds.length > 0 && (
        <ul className="mt-4 space-y-2 border-b border-ink/10 pb-4 text-sm">
          {refunds.map((r) => (
            <li key={r.id} className="flex justify-between gap-4">
              <span className="text-ink/70">
                {new Date(r.created_at).toLocaleDateString("en-IN")}
                {r.reason && (
                  <span className="block text-xs text-ink/40">
                    &ldquo;{r.reason}&rdquo;
                  </span>
                )}
              </span>
              <span className="text-ink">{formatINR(r.amount_paise)}</span>
            </li>
          ))}
        </ul>
      )}

      {refundablePaise <= 0 ? (
        <p className="mt-4 text-sm text-ink/50">
          Nothing left to refund on this order.
        </p>
      ) : (
        <form action={formAction} className="mt-4">
          <p className="text-xs text-ink/40">
            Up to {formatINR(refundablePaise)} can still be refunded.
          </p>
          <div className="mt-3">
            <label htmlFor="amountRupees" className={label}>
              Amount (₹)
            </label>
            <input
              id="amountRupees"
              name="amountRupees"
              type="number"
              min="1"
              step="1"
              max={refundablePaise / 100}
              defaultValue={refundablePaise / 100}
              required
              className={field}
            />
          </div>
          <div className="mt-3">
            <label htmlFor="reason" className={label}>
              Reason (internal)
            </label>
            <input id="reason" name="reason" className={field} />
          </div>

          {state && "error" in state && state.error && (
            <p className="mt-4 whitespace-pre-line text-sm text-red-700">
              {state.error}
            </p>
          )}
          {state && "ok" in state && (
            <p className="mt-4 text-sm text-gold">Refund issued.</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-6 w-full border border-red-700 py-4 text-[11px] uppercase tracking-[0.25em] text-red-700 disabled:opacity-40"
          >
            {pending ? "Refunding…" : "Refund via Razorpay"}
          </button>
        </form>
      )}
    </div>
  );
}
