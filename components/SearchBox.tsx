"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Result = { slug: string; name: string; price: string; image: string | null };

export function SearchBox() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);

  function goToResults() {
    if (!q.trim()) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        aria-label="Search"
        onClick={() => setOpen((v) => !v)}
        className="text-ink/70 hover:text-ink"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-3 w-[90vw] max-w-sm border border-ink/10 bg-cream shadow-lg sm:w-96">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              goToResults();
            }}
            className="border-b border-ink/10 p-3"
          >
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
              placeholder="Search sarees, dresses…"
              className="w-full bg-transparent px-2 py-2 text-sm text-ink outline-none"
            />
          </form>

          {results.length > 0 && (
            <ul className="max-h-96 overflow-y-auto">
              {results.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/products/${r.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-ink/5"
                  >
                    <div className="relative h-12 w-10 shrink-0 overflow-hidden bg-ink/10">
                      {r.image && (
                        <Image src={r.image} alt="" fill sizes="40px" className="object-cover" />
                      )}
                    </div>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">{r.name}</span>
                      <span className="text-xs text-ink/50">{r.price}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {q.trim() && (
            <button
              onClick={goToResults}
              className="block w-full border-t border-ink/10 px-3 py-3 text-center text-[11px] uppercase tracking-[0.2em] text-gold hover:bg-ink/5"
            >
              View all results for “{q}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}
