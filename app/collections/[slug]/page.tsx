import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryBySlug, getProducts } from "@/lib/catalog";
import { getWishlistProductIds } from "@/lib/wishlist";
import { ProductCard } from "@/components/ProductCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export async function generateMetadata({
  params,
}: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  return { title: category?.name ?? "Collection" };
}

export default async function CollectionPage({
  params,
}: PageProps<"/collections/[slug]">) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [products, wishlist] = await Promise.all([
    getProducts({ categorySlug: slug }),
    getWishlistProductIds(),
  ]);
  const path = `/collections/${slug}`;

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

      {products.length === 0 ? (
        <p className="mt-20 text-center text-ink/50">
          Nothing in this collection yet.
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
