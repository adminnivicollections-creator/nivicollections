"use client";

import { useActionState } from "react";
import { subscribe } from "@/app/subscribe";

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribe, undefined);

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.2em] text-cream/50">
        New arrivals, first
      </p>
      <form action={formAction} className="mt-4 flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="Your email"
          className="min-w-0 flex-1 border border-cream/25 bg-transparent px-4 py-3 text-sm text-cream outline-none placeholder:text-cream/35 focus:border-gold"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 bg-gold px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "…" : "Join"}
        </button>
      </form>
      <div aria-live="polite" className="mt-2 min-h-5">
        {state && "error" in state && (
          <p className="text-xs text-red-300">{state.error}</p>
        )}
        {state && "ok" in state && (
          <p className="text-xs text-gold">{state.ok}</p>
        )}
      </div>
    </div>
  );
}
