"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatINR, imageUrl } from "@/lib/config";
import type { Category, Product } from "@/lib/supabase/types";
import { bulkSetActive, bulkSetCategory } from "../actions";

type Row = Product & {
  product_variants: { stock: number }[];
  categories: { name: string } | null;
  product_images: { storage_path: string; position: number }[];
};

export function ProductsTable({
  products,
  categories,
}: {
  products: Row[];
  categories: Category[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const allSelected = selected.size > 0 && selected.size === products.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(products.map((p) => p.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function runBulk(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      setSelected(new Set());
    });
  }

  return (
    <div className="overflow-x-auto">
      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-4 border border-ink/20 bg-blush/40 px-4 py-3 text-sm">
          <span className="text-ink">{selected.size} selected</span>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              runBulk(() => bulkSetActive([...selected], true))
            }
            className="text-xs uppercase tracking-[0.15em] text-gold disabled:opacity-40"
          >
            Show
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              runBulk(() => bulkSetActive([...selected], false))
            }
            className="text-xs uppercase tracking-[0.15em] text-red-700 disabled:opacity-40"
          >
            Hide
          </button>
          <label className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-ink/60">
            Move to
            <select
              disabled={pending}
              defaultValue=""
              onChange={(e) => {
                if (!e.target.value) return;
                runBulk(() => bulkSetCategory([...selected], e.target.value));
                e.target.value = "";
              }}
              className="border border-ink/20 bg-transparent px-2 py-1 normal-case tracking-normal text-ink"
            >
              <option value="" disabled>
                Choose category…
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <table className="w-full text-left text-sm">
        <thead className="border-b border-ink/10 text-[11px] uppercase tracking-[0.15em] text-ink/50">
          <tr>
            <th className="w-8 py-3 pr-2 font-normal">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Select all products"
              />
            </th>
            <th className="py-3 pr-4 font-normal" />
            <th className="py-3 pr-4 font-normal">Product</th>
            <th className="py-3 pr-4 font-normal">SKU</th>
            <th className="py-3 pr-4 font-normal">Category</th>
            <th className="py-3 pr-4 font-normal">Price</th>
            <th className="py-3 pr-4 font-normal">Stock</th>
            <th className="py-3 font-normal">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/10">
          {products.map((p) => {
            const stock = p.product_variants.reduce((n, v) => n + v.stock, 0);
            const thumb = [...p.product_images].sort(
              (a, b) => a.position - b.position,
            )[0];

            return (
              <tr key={p.id}>
                <td className="py-4 pr-2">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleOne(p.id)}
                    aria-label={`Select ${p.name}`}
                  />
                </td>
                <td className="w-16 py-4 pr-4">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="relative block h-14 w-14 overflow-hidden bg-blush"
                  >
                    {thumb && (
                      <Image
                        src={imageUrl(thumb.storage_path)}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    )}
                  </Link>
                </td>
                <td className="py-4 pr-4">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="font-serif text-base text-ink hover:text-gold"
                  >
                    {p.name}
                  </Link>
                </td>
                <td className="py-4 pr-4 text-ink/60">{p.sku ?? "—"}</td>
                <td className="py-4 pr-4 text-ink/60">
                  {p.categories?.name ?? "—"}
                </td>
                <td className="py-4 pr-4">{formatINR(p.price_paise)}</td>
                <td
                  className={`py-4 pr-4 ${stock === 0 ? "text-red-700" : "text-ink"}`}
                >
                  {stock}
                </td>
                <td className="py-4 text-ink/60">
                  {p.active ? "Live" : "Hidden"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
