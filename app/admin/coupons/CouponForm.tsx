"use client";

import { useActionState, useState } from "react";
import { createCoupon } from "./actions";

const field =
  "mt-1 w-full border border-ink/20 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-ink";
const label = "text-[11px] uppercase tracking-[0.2em] text-ink/60";

export function CouponForm() {
  const [state, formAction, pending] = useActionState(createCoupon, undefined);
  const [type, setType] = useState<"percent" | "flat">("percent");

  return (
    <form action={formAction} className="mt-6 max-w-2xl space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="code" className={label}>
            Code
          </label>
          <input
            id="code"
            name="code"
            required
            placeholder="FESTIVE10"
            className={`${field} font-mono uppercase`}
          />
        </div>
        <div>
          <label htmlFor="description" className={label}>
            Description (internal)
          </label>
          <input id="description" name="description" className={field} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="discountType" className={label}>
            Type
          </label>
          <select
            id="discountType"
            name="discountType"
            value={type}
            onChange={(e) => setType(e.target.value as "percent" | "flat")}
            className={field}
          >
            <option value="percent">Percent off</option>
            <option value="flat">Flat amount off (₹)</option>
          </select>
        </div>
        <div>
          <label htmlFor="discountValue" className={label}>
            {type === "percent" ? "Percent" : "Amount (₹)"}
          </label>
          <input
            id="discountValue"
            name="discountValue"
            type="number"
            min="1"
            max={type === "percent" ? 100 : undefined}
            required
            className={field}
          />
        </div>
        {type === "percent" && (
          <div>
            <label htmlFor="maxDiscountRupees" className={label}>
              Max discount (₹, optional)
            </label>
            <input
              id="maxDiscountRupees"
              name="maxDiscountRupees"
              type="number"
              min="0"
              className={field}
            />
          </div>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="minSubtotalRupees" className={label}>
            Minimum cart (₹)
          </label>
          <input
            id="minSubtotalRupees"
            name="minSubtotalRupees"
            type="number"
            min="0"
            defaultValue={0}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="expiresAt" className={label}>
            Expires (optional)
          </label>
          <input id="expiresAt" name="expiresAt" type="date" className={field} />
        </div>
        <div>
          <label htmlFor="maxRedemptions" className={label}>
            Max uses (optional)
          </label>
          <input
            id="maxRedemptions"
            name="maxRedemptions"
            type="number"
            min="1"
            className={field}
          />
        </div>
      </div>

      {state?.error && (
        <p className="whitespace-pre-line text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-ink px-8 py-3 text-[11px] uppercase tracking-[0.2em] text-cream disabled:opacity-40"
      >
        {pending ? "Saving…" : "Create coupon"}
      </button>
    </form>
  );
}
