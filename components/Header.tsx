"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";
import { BRAND } from "@/lib/config";
import { SearchBox } from "./SearchBox";
import type { Category } from "@/lib/supabase/types";

export function Header({
  categories,
  signedIn,
  announcement,
}: {
  categories: Category[];
  signedIn: boolean;
  announcement?: string;
}) {
  const { count, hydrated, openDrawer } = useCart();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActiveCategory = (slug: string) =>
    pathname === `/collections/${slug}`;

  return (
    <header className="sticky top-0 z-50 border-b border-cream/10 bg-black/95 backdrop-blur">
      {announcement && (
        <div className="bg-ink py-1.5 text-center text-[10px] uppercase tracking-[0.25em] text-cream">
          {announcement}
        </div>
      )}

      <div className="mx-auto grid max-w-7xl grid-cols-3 items-center px-5 py-2">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="text-sm tracking-wide text-cream md:hidden"
          >
            {open ? "Close" : "Menu"}
          </button>
          <nav className="hidden md:block">
            <ul className="flex flex-wrap items-center gap-x-8 gap-y-2">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/collections/${c.slug}`}
                    aria-current={isActiveCategory(c.slug) ? "page" : undefined}
                    className={`whitespace-nowrap text-[11px] uppercase tracking-[0.2em] transition-colors hover:text-gold ${
                      isActiveCategory(c.slug) ? "text-gold" : "text-cream/80"
                    }`}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <Link href="/" aria-label={BRAND.name} className="justify-self-center">
          <Image
            src="/images/nivicollectionslogo-transparent.png"
            alt={BRAND.name}
            width={403}
            height={121}
            priority
            className="h-8 w-auto md:h-10"
          />
        </Link>

        <div className="flex items-center justify-end gap-5">
          <SearchBox />
          <Link
            href={signedIn ? "/account" : "/login"}
            aria-label={signedIn ? "Account" : "Sign in"}
            className="hidden text-cream/70 hover:text-cream sm:block"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
          </Link>
          <button
            type="button"
            onClick={openDrawer}
            aria-label="Cart"
            className="relative text-cream/70 hover:text-cream"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <path d="M6 8h12l1 12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1L6 8Zm3-1V6a3 3 0 0 1 6 0v1" />
            </svg>
            {hydrated && count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-medium text-cream">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Account/Sign in and Cart are deliberately left out here — BottomNav
          already covers both at this exact breakpoint, so repeating them
          would just be the same link twice. */}
      {open && (
        <nav className="border-t border-cream/10 md:hidden">
          <ul className="flex flex-col px-5 py-3">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/collections/${c.slug}`}
                  onClick={() => setOpen(false)}
                  aria-current={isActiveCategory(c.slug) ? "page" : undefined}
                  className={`block py-3 text-[11px] uppercase tracking-[0.2em] ${
                    isActiveCategory(c.slug) ? "text-gold" : "text-cream/80"
                  }`}
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
