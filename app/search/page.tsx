import { searchProducts } from "@/lib/catalog";
import { getWishlistProductIds } from "@/lib/wishlist";
import { ProductCard } from "@/components/ProductCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";

  const [products, wishlist] = await Promise.all([
    searchProducts(q, 60),
    getWishlistProductIds(),
  ]);
  const path = `/search?q=${encodeURIComponent(q)}`;

  return (
    <div className="mx-auto max-w-7xl px-5 py-16">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
      <h1 className="mt-6 text-center font-serif text-4xl font-light text-ink">
        {q ? `Results for “${q}”` : "Search"}
      </h1>
      <p className="mt-3 text-center text-sm text-ink/60">
        {products.length} {products.length === 1 ? "piece" : "pieces"}
      </p>

      {q && products.length === 0 ? (
        <p className="mt-20 text-center text-ink/50">
          Nothing matches “{q}”. Try a different word.
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
