import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryBySlug, getProductCount, getProducts, isSoldOut } from "@/lib/catalog";
import { getWishlistProductIds } from "@/lib/wishlist";
import { ProductCard } from "@/components/ProductCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SortFilterBar } from "@/components/SortFilterBar";
import { Pager } from "@/components/Pager";

const PAGE_SIZE = 24;
// ponytail: "in stock only" filters on a per-variant join, which SQL can't
// paginate as a simple column — so that path filters in JS over a bounded
// window instead of a true unbounded fetch. 300 comfortably covers any
// catalogue size this store will reach soon; if it ever needs more, move
// stock into a materialized per-product column or view and filter in SQL.
const IN_STOCK_FILTER_CEILING = 300;

export async function generateMetadata({
  params,
}: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  return { title: category?.name ?? "Collection" };
}

export default async function CollectionPage({
  params,
  searchParams,
}: PageProps<"/collections/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const wishlist = await getWishlistProductIds();
  const path = `/collections/${slug}`;

  const inStockOnly = sp.inStock === "1";
  const sort =
    sp.sort === "price_asc" || sp.sort === "price_desc" ? sp.sort : "newest";
  const page = Math.max(1, Number(sp.page) || 1);

  let products;
  let totalCount;
  let totalPages;

  if (inStockOnly) {
    const filtered = (
      await getProducts({ categorySlug: slug, sort, limit: IN_STOCK_FILTER_CEILING })
    ).filter((p) => !isSoldOut(p));
    totalCount = filtered.length;
    totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    products = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  } else {
    [products, totalCount] = await Promise.all([
      getProducts({ categorySlug: slug, sort, page, pageSize: PAGE_SIZE }),
      getProductCount(slug),
    ]);
    totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-16">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: category.name }]}
      />
      <h1 className="mt-6 text-center font-serif text-4xl font-light text-ink">
        {category.name}
      </h1>
      <p className="mt-3 text-center text-sm text-ink/60">
        {totalCount} {totalCount === 1 ? "piece" : "pieces"}
      </p>

      {totalCount > 0 && <SortFilterBar />}

      {totalCount === 0 ? (
        <p className="mt-20 text-center text-ink/50">
          {inStockOnly
            ? "Nothing in stock right now — try clearing the filter."
            : "Nothing in this collection yet."}
        </p>
      ) : (
        <>
          <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                wishlisted={wishlist.has(p.id)}
                path={path}
              />
            ))}
          </div>
          <Pager page={page} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}
