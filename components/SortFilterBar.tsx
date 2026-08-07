"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export function SortFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sort = searchParams.get("sort") ?? "newest";
  const inStock = searchParams.get("inStock") === "1";

  function update(next: { sort?: string; inStock?: boolean }) {
    const params = new URLSearchParams(searchParams.toString());
    const nextSort = next.sort ?? sort;
    const nextInStock = next.inStock ?? inStock;

    if (nextSort === "newest") params.delete("sort");
    else params.set("sort", nextSort);

    if (nextInStock) params.set("inStock", "1");
    else params.delete("inStock");

    // A changed sort/filter can leave fewer pages than the one currently
    // showing — start back at the first page rather than landing on a gap.
    params.delete("page");

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-ink/10 py-4">
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(e) => update({ inStock: e.target.checked })}
          className="h-4 w-4 accent-gold"
        />
        In stock only
      </label>

      <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-ink/60">
        Sort by
        <select
          value={sort}
          onChange={(e) => update({ sort: e.target.value })}
          className="border border-ink/20 bg-transparent px-3 py-2 text-sm normal-case tracking-normal text-ink"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
