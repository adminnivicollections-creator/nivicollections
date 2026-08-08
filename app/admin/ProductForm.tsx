"use client";

import { useActionState, useState } from "react";
import type { Category, Product, ProductVariant } from "@/lib/supabase/types";
import type { ActionResult } from "./actions";

const field =
  "mt-1 w-full border border-ink/20 bg-transparent px-4 py-3 text-sm outline-none focus:border-ink";
const label = "text-[11px] uppercase tracking-[0.2em] text-ink/60";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ProductForm({
  action,
  categories,
  product,
  variants = [],
  submitLabel,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  categories: Category[];
  product?: Product;
  variants?: ProductVariant[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(product));
  const [rows, setRows] = useState<{ size: string; stock: number }[]>(
    variants.length > 0
      ? variants.map((v) => ({ size: v.size, stock: v.stock }))
      : [{ size: "Free Size", stock: 1 }],
  );

  return (
    <form action={formAction} className="max-w-2xl space-y-6 py-10">
      <div>
        <label htmlFor="name" className={label}>
          Product name
        </label>
        <input
          id="name"
          name="name"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugEdited) setSlug(slugify(e.target.value));
          }}
          className={field}
        />
      </div>

      <div>
        <label htmlFor="slug" className={label}>
          URL slug
        </label>
        <input
          id="slug"
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugEdited(true);
          }}
          className={field}
        />
        <p className="mt-1 text-xs text-ink/40">/products/{slug || "…"}</p>
      </div>

      <div>
        <label htmlFor="description" className={label}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={product?.description ?? ""}
          className={field}
        />
      </div>

      <div>
        <label htmlFor="categoryId" className={label}>
          Category
        </label>
        <select
          id="categoryId"
          name="categoryId"
          required
          defaultValue={product?.category_id ?? categories[0]?.id}
          className={field}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="sku" className={label}>
            SKU (optional)
          </label>
          <input
            id="sku"
            name="sku"
            defaultValue={product?.sku ?? ""}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="barcode" className={label}>
            Barcode (optional)
          </label>
          <input
            id="barcode"
            name="barcode"
            defaultValue={product?.barcode ?? ""}
            className={field}
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="priceRupees" className={label}>
            Price (₹)
          </label>
          <input
            id="priceRupees"
            name="priceRupees"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={product ? product.price_paise / 100 : ""}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="compareAtRupees" className={label}>
            Compare-at price (₹, optional)
          </label>
          <input
            id="compareAtRupees"
            name="compareAtRupees"
            type="number"
            min="0"
            step="1"
            defaultValue={
              product?.compare_at_paise ? product.compare_at_paise / 100 : ""
            }
            className={field}
          />
        </div>
      </div>

      <fieldset>
        <legend className={label}>Sizes and stock</legend>
        <div className="mt-3 space-y-3">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                name="size"
                aria-label={`Size ${i + 1}`}
                placeholder="Free Size"
                required
                value={row.size}
                onChange={(e) =>
                  setRows(
                    rows.map((r, j) =>
                      j === i ? { ...r, size: e.target.value } : r,
                    ),
                  )
                }
                className="flex-1 border border-ink/20 bg-transparent px-4 py-2 text-sm outline-none focus:border-ink"
              />
              <input
                name="stock"
                type="number"
                min="0"
                aria-label={`Stock for size ${i + 1}`}
                value={row.stock}
                onChange={(e) =>
                  setRows(
                    rows.map((r, j) =>
                      j === i ? { ...r, stock: Number(e.target.value) } : r,
                    ),
                  )
                }
                className="w-28 border border-ink/20 bg-transparent px-4 py-2 text-sm outline-none focus:border-ink"
              />
              <button
                type="button"
                onClick={() => setRows(rows.filter((_, j) => j !== i))}
                disabled={rows.length === 1}
                className="text-xs uppercase tracking-[0.15em] text-ink/50 hover:text-ink disabled:opacity-30"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setRows([...rows, { size: "", stock: 0 }])}
          className="mt-3 text-xs uppercase tracking-[0.15em] text-gold"
        >
          + Add size
        </button>
      </fieldset>

      <div>
        <label htmlFor="publishAt" className={label}>
          Schedule publish (optional)
        </label>
        <input
          id="publishAt"
          name="publishAt"
          type="datetime-local"
          defaultValue={
            product?.publish_at
              ? product.publish_at.slice(0, 16)
              : ""
          }
          className={field}
        />
        <p className="mt-1 text-xs text-ink/40">
          Leave empty to publish immediately. Set a future date to schedule.
        </p>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-3 text-sm text-ink">
          <input
            type="checkbox"
            name="readyToShip"
            defaultChecked={product?.ready_to_ship ?? true}
          />
          Ready to ship (dispatches in 2 to 3 days)
        </label>
        <label className="flex items-center gap-3 text-sm text-ink">
          <input
            type="checkbox"
            name="active"
            defaultChecked={product?.active ?? true}
          />
          Visible in the shop
        </label>
      </div>

      {state?.error && (
        <p className="whitespace-pre-line text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-ink px-10 py-4 text-[11px] uppercase tracking-[0.25em] text-cream disabled:opacity-40"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
