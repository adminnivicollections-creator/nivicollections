import Link from "next/link";
import { BRAND } from "@/lib/config";
import { NewsletterForm } from "./NewsletterForm";
import type { Category } from "@/lib/supabase/types";

export function Footer({ categories }: { categories: Category[] }) {
  return (
    <footer className="mt-24 bg-ink text-cream">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-3">
        <div>
          <p className="font-serif text-xl uppercase tracking-[0.25em]">
            {BRAND.name}
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/70">
            Handcrafted Indian occasion wear, made in limited runs by artisans
            across the country.
          </p>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-cream/50">
            Shop
          </p>
          <ul className="mt-4 space-y-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/collections/${c.slug}`}
                  className="text-sm text-cream/80 hover:text-gold"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-cream/50">
            Contact
          </p>
          <ul className="mt-4 space-y-2 text-sm text-cream/80">
            <li>{BRAND.email}</li>
            <li>{BRAND.supportHours}</li>
            <li className="pt-2">
              <Link href="/orders/track" className="hover:text-gold">
                Track an order
              </Link>
            </li>
          </ul>

          <div className="mt-8">
            <NewsletterForm />
          </div>
        </div>
      </div>

      <div className="border-t border-cream/10 py-6 text-center text-xs text-cream/50">
        © {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.
      </div>
    </footer>
  );
}
