"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import type { ProductVariant } from "@/lib/supabase/types";

export function AddToCart({
  productId,
  slug,
  name,
  pricePaise,
  imagePath,
  variants,
  soldOut,
}: {
  productId: string;
  slug: string;
  name: string;
  pricePaise: number;
  imagePath: string | null;
  variants: ProductVariant[];
  soldOut: boolean;
}) {
  const { add } = useCart();
  const [selected, setSelected] = useState<ProductVariant | null>(null);
  const [added, setAdded] = useState(false);

  if (soldOut || variants.length === 0) {
    return (
      <button
        disabled
        className="mt-10 w-full cursor-not-allowed border border-ink/30 py-4 text-[11px] uppercase tracking-[0.25em] text-ink/40"
      >
        Sold Out
      </button>
    );
  }

  return (
    <div className="mt-10">
      <p className="text-[11px] uppercase tracking-[0.2em] text-ink/60">Size</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {variants.map((v) => {
          const out = v.stock <= 0;
          return (
            <button
              key={v.id}
              disabled={out}
              onClick={() => {
                setSelected(v);
                setAdded(false);
              }}
              className={`min-w-14 border px-4 py-3 text-sm transition-colors ${
                out
                  ? "cursor-not-allowed border-ink/15 text-ink/25 line-through"
                  : selected?.id === v.id
                    ? "border-ink bg-ink text-cream"
                    : "border-ink/30 text-ink hover:border-ink"
              }`}
            >
              {v.size}
            </button>
          );
        })}
      </div>

      {selected && selected.stock <= 3 && (
        <p className="mt-3 text-xs text-gold">
          Only {selected.stock} left in {selected.size}
        </p>
      )}

      <button
        onClick={() => {
          if (!selected) return;
          add({
            variantId: selected.id,
            productId,
            slug,
            name,
            size: selected.size,
            pricePaise,
            imagePath,
          });
          setAdded(true);
        }}
        disabled={!selected}
        className="mt-8 w-full bg-ink py-4 text-[11px] uppercase tracking-[0.25em] text-cream transition-opacity disabled:opacity-40"
      >
        {!selected ? "Select a size" : added ? "Added to cart" : "Add to cart"}
      </button>
    </div>
  );
}
