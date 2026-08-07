"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import { gaEvent } from "@/lib/gtag";
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
        className="mt-10 w-full cursor-not-allowed border border-[#c59e5a]/30 py-4 text-[11px] uppercase tracking-[0.25em] text-[#f3e6cc]/40"
      >
        Sold Out
      </button>
    );
  }

  return (
    <div className="mt-10">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[#f3e6cc]/60">
        Size
      </p>
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
                  ? "cursor-not-allowed border-[#f3e6cc]/15 text-[#f3e6cc]/25 line-through"
                  : selected?.id === v.id
                    ? "border-[#c59e5a] bg-[#c59e5a] text-[#0b0906]"
                    : "border-[#c59e5a]/30 text-[#f3e6cc] hover:border-[#c59e5a]"
              }`}
            >
              {v.size}
            </button>
          );
        })}
      </div>

      {selected && selected.stock <= 3 && (
        <p className="mt-3 text-xs text-[#c59e5a]">
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
          gaEvent("add_to_cart", {
            currency: "INR",
            value: pricePaise / 100,
            items: [
              { item_id: productId, item_name: name, price: pricePaise / 100, quantity: 1 },
            ],
          });
          setAdded(true);
        }}
        disabled={!selected}
        className="mt-8 w-full bg-[#c59e5a] py-4 text-[11px] uppercase tracking-[0.25em] text-[#0b0906] transition-opacity disabled:opacity-40"
      >
        {!selected ? "Select a size" : added ? "Added to cart" : "Add to cart"}
      </button>
    </div>
  );
}
