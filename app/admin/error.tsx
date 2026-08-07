"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="py-20 text-center">
      <h2 className="font-serif text-2xl font-light text-ink">
        Something went wrong
      </h2>
      <p className="mt-3 text-sm text-ink/60">
        {error.message || "That action failed. Nothing else on this page was affected."}
      </p>
      <button
        onClick={reset}
        className="mt-8 border border-ink px-8 py-3 text-[11px] uppercase tracking-[0.2em] text-ink hover:bg-ink hover:text-cream"
      >
        Try again
      </button>
    </div>
  );
}
