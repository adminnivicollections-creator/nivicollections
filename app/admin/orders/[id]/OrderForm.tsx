"use client";

import { useActionState, useState } from "react";
import type { Order, OrderStatus } from "@/lib/supabase/types";
import type { ActionResult } from "../actions";

// Mirrors NEXT_STATUS in actions.ts so the dropdown only offers moves the
// server will accept. The server is still the one enforcing it. "refunded"
// is deliberately unreachable here — see the Refund section below, which is
// the only path that can actually set it (after Razorpay confirms money moved).
const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["cancelled"],
  paid: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  refunded: [],
};

const LABEL: Record<OrderStatus, string> = {
  pending_payment: "Pending payment",
  paid: "Paid",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export function OrderForm({
  action,
  order,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  order: Order;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [status, setStatus] = useState<OrderStatus>(order.status);

  const options = [order.status, ...NEXT_STATUS[order.status]];
  const terminal = NEXT_STATUS[order.status].length === 0;

  const field =
    "mt-1 w-full border border-ink/20 bg-transparent px-4 py-3 text-sm outline-none focus:border-ink";
  const label = "text-[11px] uppercase tracking-[0.2em] text-ink/60";

  return (
    <form action={formAction} className="h-fit border border-ink/10 p-6">
      <h3 className={label}>Fulfilment</h3>

      <div className="mt-5">
        <label htmlFor="status" className={label}>
          Status
        </label>
        <select
          id="status"
          name="status"
          value={status}
          disabled={terminal}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
          className={`${field} disabled:opacity-50`}
        >
          {options.map((s) => (
            <option key={s} value={s}>
              {LABEL[s]}
            </option>
          ))}
        </select>
        {terminal && (
          <p className="mt-2 text-xs text-ink/40">
            This order is closed and cannot change status.
          </p>
        )}
      </div>

      <div className="mt-5">
        <label htmlFor="carrier" className={label}>
          Carrier
        </label>
        <input
          id="carrier"
          name="carrier"
          defaultValue={order.carrier}
          placeholder="Delhivery, Blue Dart…"
          className={field}
        />
      </div>

      <div className="mt-5">
        <label htmlFor="trackingNumber" className={label}>
          Tracking number
        </label>
        <input
          id="trackingNumber"
          name="trackingNumber"
          defaultValue={order.tracking_number}
          className={field}
        />
        {status === "shipped" && (
          <p className="mt-2 text-xs text-gold">
            Marking this shipped emails the customer their tracking number.
          </p>
        )}
      </div>

      <div className="mt-5">
        <label htmlFor="adminNote" className={label}>
          Internal note
        </label>
        <textarea
          id="adminNote"
          name="adminNote"
          rows={3}
          defaultValue={order.admin_note}
          className={field}
        />
        <p className="mt-1 text-xs text-ink/40">Never shown to the customer.</p>
      </div>

      {state && "error" in state && state.error && (
        <p className="mt-4 text-sm text-red-700">{state.error}</p>
      )}
      {state && "ok" in state && (
        <p className="mt-4 text-sm text-gold">Saved.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full bg-ink py-4 text-[11px] uppercase tracking-[0.25em] text-cream disabled:opacity-40"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
