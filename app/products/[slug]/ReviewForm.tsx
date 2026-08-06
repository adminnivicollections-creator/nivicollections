"use client";

import { useActionState, useState } from "react";
import { submitReview } from "./reviewActions";

export function ReviewForm({
  productId,
  slug,
  orderItems,
}: {
  productId: string;
  slug: string;
  orderItems: { id: string; orderNumber: string }[];
}) {
  const action = submitReview.bind(null, slug);
  const [state, formAction, pending] = useActionState(action, undefined);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  if (state && "ok" in state) {
    return (
      <p className="mt-8 border border-[#c59e5a]/40 bg-[#c59e5a]/10 px-5 py-4 text-sm text-[#f3e6cc]">
        Thank you — your review is live.
      </p>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-8 space-y-4 border border-[#c59e5a]/20 p-6"
    >
      <input type="hidden" name="productId" value={productId} />
      <p className="text-[11px] uppercase tracking-[0.2em] text-[#c59e5a]">
        Write a review
      </p>

      {orderItems.length > 1 ? (
        <div>
          <label htmlFor="orderItemId" className="text-xs text-[#f3e6cc]/60">
            Which order?
          </label>
          <select
            id="orderItemId"
            name="orderItemId"
            required
            className="mt-1 w-full border border-[#c59e5a]/30 bg-[#0b0906] px-3 py-2 text-sm text-[#f3e6cc]"
          >
            {orderItems.map((o) => (
              <option key={o.id} value={o.id}>
                {o.orderNumber}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" name="orderItemId" value={orderItems[0].id} />
      )}

      <div>
        <span className="text-xs text-[#f3e6cc]/60">Your rating</span>
        <div className="mt-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="p-0.5"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 20 20"
                fill={(hover || rating) >= n ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1"
                className={
                  (hover || rating) >= n
                    ? "text-[#c59e5a]"
                    : "text-[#f3e6cc]/30"
                }
              >
                <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L10 14.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8L10 1.5Z" />
              </svg>
            </button>
          ))}
        </div>
        <input type="hidden" name="rating" value={rating} />
      </div>

      <div>
        <label htmlFor="title" className="text-xs text-[#f3e6cc]/60">
          Title (optional)
        </label>
        <input
          id="title"
          name="title"
          maxLength={120}
          className="mt-1 w-full border border-[#c59e5a]/30 bg-transparent px-3 py-2 text-sm text-[#f3e6cc]"
        />
      </div>

      <div>
        <label htmlFor="body" className="text-xs text-[#f3e6cc]/60">
          Your review (optional)
        </label>
        <textarea
          id="body"
          name="body"
          rows={3}
          maxLength={2000}
          className="mt-1 w-full border border-[#c59e5a]/30 bg-transparent px-3 py-2 text-sm text-[#f3e6cc]"
        />
      </div>

      {state && "error" in state && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending || rating === 0}
        className="bg-[#c59e5a] px-8 py-3 text-[11px] uppercase tracking-[0.2em] text-[#0b0906] disabled:opacity-40"
      >
        {pending ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
