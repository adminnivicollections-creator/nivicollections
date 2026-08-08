"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import { gaEvent } from "@/lib/gtag";

export function AddToCartFromWishlist({
  productId,
  slug,
  name,
  pricePaise,
  imagePath,
  variants,
}: {
  productId: string;
  slug: string;
  name: string;
  pricePaise: number;
  imagePath: string | null;
  variants: { id: string; size: string; stock: number }[];
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const available = variants.filter((v) => v.stock > 0);
  if (available.length === 0) return null;

  const single = available.length === 1;
  const chosen = available.find((v) => v.id === (single ? available[0].id : selected));

  function handleAdd() {
    if (!chosen) return;
    add({
      variantId: chosen.id,
      productId,
      slug,
      name,
      size: chosen.size,
      pricePaise,
      imagePath,
    });
    gaEvent("add_to_cart", {
      currency: "INR",
      value: pricePaise / 100,
      items: [{ item_id: productId, item_name: name, price: pricePaise / 100, quantity: 1 }],
    });
    setAdded(true);
    setSelected(null);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="mt-3" onClick={(e) => e.preventDefault()}>
      {!single && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {available.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setSelected(v.id)}
              className={`border px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors ${
                selected === v.id
                  ? "border-[#c59e5a] bg-[#c59e5a] text-[#0b0906]"
                  : "border-[#c59e5a]/30 text-[#f3e6cc]/70 hover:border-[#c59e5a]"
              }`}
            >
              {v.size}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        disabled={!chosen}
        onClick={handleAdd}
        className="w-full border border-[#c59e5a]/40 py-2.5 text-[10px] uppercase tracking-[0.2em] text-[#c59e5a] transition-colors hover:bg-[#c59e5a] hover:text-[#0b0906] disabled:opacity-40"
      >
        {added ? "Added" : !single && !chosen ? "Select size" : "Add to cart"}
      </button>
    </div>
  );
}
