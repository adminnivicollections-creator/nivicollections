"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatINR, imageUrl } from "@/lib/config";

type RecentProduct = {
  slug: string;
  name: string;
  pricePaise: number;
  imagePath: string | null;
  viewedAt: number;
};

const KEY = "nivi-recently-viewed-v1";
const MAX = 8;

function read(): RecentProduct[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function record(entry: Omit<RecentProduct, "viewedAt">) {
  const existing = read().filter((p) => p.slug !== entry.slug);
  const next = [{ ...entry, viewedAt: Date.now() }, ...existing].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private browsing, quota) — recently-viewed is a
    // convenience, not a feature worth crashing the page over.
  }
}

/**
 * Records the current product into the browsing history, then renders the
 * rest of that history. Nothing server-rendered — this is purely a client
 * convenience, no schema, no tracking beyond the visitor's own browser.
 */
export function RecentlyViewed({
  current,
}: {
  current: {
    slug: string;
    name: string;
    pricePaise: number;
    imagePath: string | null;
  };
}) {
  const [items, setItems] = useState<RecentProduct[]>([]);

  useEffect(() => {
    record(current);
    // localStorage is only readable client-side, so this list can only ever
    // be populated after mount — there is no pure-render alternative here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(read().filter((p) => p.slug !== current.slug));
    // Only the identity of the product being viewed should re-trigger this,
    // not every render of the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.slug]);

  if (items.length === 0) return null;

  return (
    <section className="mt-28 border-t border-[#c59e5a]/20 pt-16">
      <h2 className="font-serif text-3xl font-light text-[#f3e6cc]">
        Recently Viewed
      </h2>
      <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
        {items.map((p) => (
          <Link key={p.slug} href={`/products/${p.slug}`} className="group block">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#c59e5a]/10">
              {p.imagePath && (
                <Image
                  src={imageUrl(p.imagePath)}
                  alt={p.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              )}
            </div>
            <p className="pt-3 font-serif text-sm text-[#f3e6cc]">{p.name}</p>
            <p className="pt-1 text-sm text-[#f3e6cc]/70">
              {formatINR(p.pricePaise)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
