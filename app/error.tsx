"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
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
    <div className="mx-auto max-w-xl px-5 py-32 text-center">
      <h1 className="font-serif text-4xl font-light text-ink">
        Something went wrong
      </h1>
      <p className="mt-4 text-ink/60">
        That&rsquo;s on us, not you. Please try again.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={reset}
          className="border border-ink px-10 py-4 text-[11px] uppercase tracking-[0.25em] text-ink transition-colors hover:bg-ink hover:text-cream"
        >
          Try again
        </button>
        <Link
          href="/"
          className="text-[11px] uppercase tracking-[0.2em] text-gold"
        >
          Back to shop
        </Link>
      </div>
    </div>
  );
}
