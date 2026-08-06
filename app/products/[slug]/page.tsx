import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getProductBySlug, getRelatedProducts, isSoldOut } from "@/lib/catalog";
import { getWishlistProductIds } from "@/lib/wishlist";
import { getReviewSummary } from "@/lib/reviews";
import { getFrequentlyBoughtWith } from "@/lib/recommendations";
import { getUserId } from "@/lib/auth";
import { formatINR } from "@/lib/config";
import { ProductMedia } from "@/components/ProductMedia";
import { ProductCard } from "@/components/ProductCard";
import { WishlistHeart } from "@/components/WishlistHeart";
import { Stars } from "@/components/Stars";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { TryOnWidget } from "@/components/TryOnWidget";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AddToCart } from "./AddToCart";
import { Reviews } from "./Reviews";
import { QA } from "./QA";

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Not found" };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductPage({
  params,
}: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const path = `/products/${slug}`;
  const [related, wishlist, reviewSummary, frequentlyBoughtWith, userId] =
    await Promise.all([
      getRelatedProducts(product),
      getWishlistProductIds(),
      getReviewSummary(product.id),
      getFrequentlyBoughtWith(product.id),
      getUserId(),
    ]);
  const [hero, ...rest] = product.product_images;

  return (
    <div className="min-h-dvh bg-[#0b0906] px-5 py-12">
      <div className="mx-auto max-w-7xl">
        <Breadcrumbs
          dark
          items={[
            { label: "Home", href: "/" },
            ...(product.categories
              ? [
                  {
                    label: product.categories.name,
                    href: `/collections/${product.categories.slug}`,
                  },
                ]
              : []),
            { label: product.name },
          ]}
        />

        <div className="mt-6 grid gap-12 md:grid-cols-2">
          <div className="grid gap-3">
            <div className="relative">
              <ProductMedia
                image={hero}
                alt={product.name}
                className="aspect-[3/4] w-full"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              <WishlistHeart
                productId={product.id}
                initialWishlisted={wishlist.has(product.id)}
                path={path}
                className="absolute right-3 top-3"
              />
            </div>
            {rest.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {rest.slice(0, 4).map((img) => (
                  <ProductMedia
                    key={img.id}
                    image={img}
                    alt={product.name}
                    className="aspect-square w-full"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="md:sticky md:top-40 md:self-start">
            {product.categories && (
              <Link
                href={`/collections/${product.categories.slug}`}
                className="text-[11px] uppercase tracking-[0.2em] text-[#c59e5a]"
              >
                {product.categories.name}
              </Link>
            )}
            <h1 className="mt-4 font-serif text-3xl font-light leading-tight text-[#f3e6cc]">
              {product.name}
            </h1>

            {reviewSummary.count > 0 && (
              <a
                href="#reviews"
                className="mt-2 flex items-center gap-2 text-sm text-[#f3e6cc]/70"
              >
                <Stars value={reviewSummary.average} />
                {reviewSummary.average.toFixed(1)} ({reviewSummary.count})
              </a>
            )}

            <p className="mt-4 flex items-baseline gap-3 text-lg text-[#f3e6cc]">
              {formatINR(product.price_paise)}
              {product.compare_at_paise && (
                <span className="text-sm text-[#f3e6cc]/40 line-through">
                  {formatINR(product.compare_at_paise)}
                </span>
              )}
            </p>
            <p className="mt-1 text-xs text-[#f3e6cc]/50">
              Inclusive of all taxes
            </p>

            {product.description && (
              <p className="mt-8 leading-relaxed text-[#f3e6cc]/70">
                {product.description}
              </p>
            )}

            <div id="add-to-cart">
            <AddToCart
              productId={product.id}
              slug={product.slug}
              name={product.name}
              pricePaise={product.price_paise}
              imagePath={hero?.storage_path ?? null}
              variants={product.product_variants}
              soldOut={isSoldOut(product)}
            />
            </div>

            <dl className="mt-12 space-y-4 border-t border-[#c59e5a]/20 pt-8 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#f3e6cc]/60">Dispatch</dt>
                <dd className="text-[#f3e6cc]">
                  {product.ready_to_ship
                    ? "Ships in 2 to 3 days"
                    : "3 to 4 weeks"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#f3e6cc]/60">Shipping</dt>
                <dd className="text-[#f3e6cc]">Free above ₹1,500</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#f3e6cc]/60">Care</dt>
                <dd className="text-[#f3e6cc]">Dry clean only</dd>
              </div>
            </dl>
          </div>
        </div>

        <TryOnWidget
          productId={product.id}
          signedIn={Boolean(userId)}
          path={path}
        />

        {frequentlyBoughtWith.length > 0 && (
          <section className="mt-28">
            <h2 className="text-center font-serif text-3xl font-light text-[#f3e6cc]">
              Frequently Bought Together
            </h2>
            <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
              {frequentlyBoughtWith.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  wishlisted={wishlist.has(p.id)}
                  path={path}
                  dark
                />
              ))}
            </div>
          </section>
        )}

        <Reviews productId={product.id} slug={slug} />
        <QA productId={product.id} slug={slug} />

        {related.length > 0 && (
          <section className="mt-28">
            <h2 className="text-center font-serif text-3xl font-light text-[#f3e6cc]">
              You May Also Like
            </h2>
            <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  wishlisted={wishlist.has(p.id)}
                  path={path}
                  dark
                />
              ))}
            </div>
          </section>
        )}

        <RecentlyViewed
          current={{
            slug: product.slug,
            name: product.name,
            pricePaise: product.price_paise,
            imagePath: hero?.storage_path ?? null,
          }}
        />
      </div>
    </div>
  );
}
