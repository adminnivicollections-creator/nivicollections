"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function Pager({ page, totalPages }: { page: number; totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function hrefFor(target: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (target <= 1) params.delete("page");
    else params.set("page", String(target));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <nav
      aria-label="Pagination"
      className="mt-16 flex items-center justify-center gap-6 text-[11px] uppercase tracking-[0.2em]"
    >
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className="text-ink hover:text-gold">
          Previous
        </Link>
      ) : (
        <span className="text-ink/30">Previous</span>
      )}
      <span className="text-ink/60">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className="text-ink hover:text-gold">
          Next
        </Link>
      ) : (
        <span className="text-ink/30">Next</span>
      )}
    </nav>
  );
}
