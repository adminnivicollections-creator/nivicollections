import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryBySlug, getProducts, isSoldOut } from "@/lib/catalog";
import { getWishlistProductIds } from "@/lib/wishlist";
import { ProductCard } from "@/components/ProductCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SortFilterBar } from "@/components/SortFilterBar";

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

  const [allProducts, wishlist] = await Promise.all([
    getProducts({ categorySlug: slug }),
    getWishlistProductIds(),
  ]);
  const path = `/collections/${slug}`;

  // The catalogue is small enough that filtering/sorting the already-fetched
  // page in JS is simpler than building a parameterised SQL query for it.
  const inStockOnly = sp.inStock === "1";
  const sort = typeof sp.sort === "string" ? sp.sort : "newest";

  const products = allProducts
    .filter((p) => !inStockOnly || !isSoldOut(p))
    .sort((a, b) => {
      if (sort === "price_asc") return a.price_paise - b.price_paise;
      if (sort === "price_desc") return b.price_paise - a.price_paise;
      return 0; // already newest-first from getProducts()
    });

  return (
    <div className="mx-auto max-w-7xl px-5 py-16">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: category.name }]}
      />
      <h1 className="mt-6 text-center font-serif text-4xl font-light text-ink">
        {category.name}
      </h1>
      <p className="mt-3 text-center text-sm text-ink/60">
        {products.length} {products.length === 1 ? "piece" : "pieces"}
      </p>

      {allProducts.length > 0 && <SortFilterBar />}

      {allProducts.length === 0 ? (
        <p className="mt-20 text-center text-ink/50">
          Nothing in this collection yet.
        </p>
      ) : products.length === 0 ? (
        <p className="mt-20 text-center text-ink/50">
          Nothing in stock right now — try clearing the filter.
        </p>
      ) : (
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
      )}
    </div>
  );
}
