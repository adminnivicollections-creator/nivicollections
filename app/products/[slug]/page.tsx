import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getProductBySlug, getRelatedProducts, isSoldOut } from "@/lib/catalog";
import { getWishlistProductIds } from "@/lib/wishlist";
import { getReviewSummary } from "@/lib/reviews";
import { getFrequentlyBoughtWith } from "@/lib/recommendations";
import { getUserId } from "@/lib/auth";
import { formatINR, imageUrl } from "@/lib/config";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductCard } from "@/components/ProductCard";
import { WishlistHeart } from "@/components/WishlistHeart";
import { ShareButton } from "@/components/ShareButton";
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

  const hero = product.product_images[0];
  const description = product.description.slice(0, 160);
  return {
    title: product.name,
    description,
    openGraph: hero
      ? {
          title: product.name,
          description,
          images: [{ url: imageUrl(hero.storage_path) }],
        }
      : undefined,
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
  const images = product.product_images;

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
          <ProductGallery images={images} alt={product.name}>
            <WishlistHeart
              productId={product.id}
              initialWishlisted={wishlist.has(product.id)}
              path={path}
            />
            <ShareButton name={product.name} path={path} />
          </ProductGallery>

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
              <Description text={product.description} />
            )}

            <div id="add-to-cart">
            <AddToCart
              productId={product.id}
              slug={product.slug}
              name={product.name}
              pricePaise={product.price_paise}
              imagePath={images[0]?.storage_path ?? null}
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
            imagePath: images[0]?.storage_path ?? null,
          }}
        />
      </div>
    </div>
  );
}

function Description({ text }: { text: string }) {
  const parts = text.split(/\s*\*\s*/);
  const prose = parts[0]?.trim();
  const bullets = parts.slice(1).filter((b) => b.trim());

  if (bullets.length === 0) {
    return <p className="mt-8 leading-relaxed text-[#f3e6cc]/70">{text}</p>;
  }

  return (
    <div className="mt-8 space-y-4 text-[#f3e6cc]/70">
      {prose && <p className="leading-relaxed">{prose}</p>}
      <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
        {bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
    </div>
  );
}
