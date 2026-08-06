"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";
import { BRAND } from "@/lib/config";
import type { Category } from "@/lib/supabase/types";

export function Header({
  categories,
  signedIn,
}: {
  categories: Category[];
  signedIn: boolean;
}) {
  const { count, hydrated } = useCart();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActiveCategory = (slug: string) =>
    pathname === `/collections/${slug}`;

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-cream/95 backdrop-blur">
      <div className="bg-ink py-1.5 text-center text-[10px] uppercase tracking-[0.25em] text-cream">
        Free shipping on orders above ₹1,500
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-2">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="w-28 text-left text-sm tracking-wide md:invisible"
        >
          {open ? "Close" : "Menu"}
        </button>

        {/* The mark's lettering is dark, which is why it only appears on the
            cream header. The footer keeps the typographic wordmark. */}
        <Link href="/" aria-label={BRAND.name} className="shrink-0">
          <Image
            src="/images/nivicollectionslogo-bg.png"
            alt={BRAND.name}
            width={1254}
            height={1254}
            priority
            className="h-[61.6px] w-auto md:h-[70.4px]"
          />
        </Link>

        <div className="flex w-28 items-center justify-end gap-4 text-sm">
          <Link
            href={signedIn ? "/account" : "/login"}
            className="hidden text-ink/70 hover:text-ink sm:block"
          >
            {signedIn ? "Account" : "Sign in"}
          </Link>
          <Link href="/cart" className="text-ink">
            {/* Suppress the count until hydration so SSR and client agree. */}
            Cart{hydrated ? ` (${count})` : ""}
          </Link>
        </div>
      </div>

      <nav className="hidden border-t border-ink/10 md:block">
        <ul className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-5 py-2.5">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/collections/${c.slug}`}
                aria-current={isActiveCategory(c.slug) ? "page" : undefined}
                className={`whitespace-nowrap text-[11px] uppercase tracking-[0.2em] transition-colors hover:text-gold ${
                  isActiveCategory(c.slug) ? "text-gold" : "text-ink/80"
                }`}
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Account/Sign in and Cart are deliberately left out here — BottomNav
          already covers both at this exact breakpoint, so repeating them
          would just be the same link twice. */}
      {open && (
        <nav className="border-t border-ink/10 md:hidden">
          <ul className="flex flex-col px-5 py-3">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/collections/${c.slug}`}
                  onClick={() => setOpen(false)}
                  aria-current={isActiveCategory(c.slug) ? "page" : undefined}
                  className={`block py-3 text-[11px] uppercase tracking-[0.2em] ${
                    isActiveCategory(c.slug) ? "text-gold" : "text-ink/80"
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
