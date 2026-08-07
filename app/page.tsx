import Link from "next/link";
import Image from "next/image";
import { getCategories, getProducts } from "@/lib/catalog";
import { getWishlistProductIds } from "@/lib/wishlist";
import { getHomepageSlides } from "@/lib/homepage";
import { getStoreSettings } from "@/lib/settings";
import { imageUrl, BRAND } from "@/lib/config";
import { ProductCard } from "@/components/ProductCard";
import { TrustBar } from "@/components/TrustBar";
import { HeroSlider } from "@/components/HeroSlider";

export default async function Home() {
  const [categories, products, wishlist, slides, settings] = await Promise.all([
    getCategories(),
    getProducts({ limit: 8 }),
    getWishlistProductIds(),
    getHomepageSlides(),
    getStoreSettings(),
  ]);

  const shopHref = categories[0]
    ? `/collections/${categories[0].slug}`
    : "/cart";

  return (
    <>
      <section className="relative bg-[#0b0906]">
        <h1 className="sr-only">
          {BRAND.legalName} — {BRAND.tagline}
        </h1>

        {slides.length > 0 ? (
          <HeroSlider slides={slides} fallbackHref={shopHref} />
        ) : (
          <Link href={shopHref} className="block">
            <Image
              src="/images/nivihomepage.png"
              alt="Nivi Collections — celebrate every moment in style. Sarees for every occasion."
              width={1774}
              height={887}
              priority
              sizes="100vw"
              className="h-auto w-full"
            />
          </Link>
        )}

        <div className="flex justify-center px-6 pb-16 pt-10">
          <Link
            href={shopHref}
            className="bg-[#c59e5a] px-12 py-4 text-[11px] uppercase tracking-[0.25em] text-[#0b0906] transition-opacity hover:opacity-90"
          >
            Shop the collection
          </Link>
        </div>
      </section>

      <TrustBar
        returnWindowDays={settings.return_window_days}
        freeShippingAbovePaise={settings.free_shipping_above_paise}
      />

      {categories.length > 1 && (
        <section className="mx-auto max-w-7xl px-5 py-24">
          <h2 className="text-center font-serif text-3xl font-light text-ink">
            Collections
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/collections/${c.slug}`}
                className="group"
              >
                <div
                  className="aspect-[4/5] w-full bg-blush bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.02]"
                  style={
                    c.image_path
                      ? { backgroundImage: `url(${imageUrl(c.image_path)})` }
                      : undefined
                  }
                />
                <p className="pt-4 text-center text-[11px] uppercase tracking-[0.2em] text-ink">
                  {c.name}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {products.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 py-24">
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.3em] text-gold">
              New in
            </p>
            <h2 className="mt-3 font-serif text-3xl font-light text-ink">
              The Collection
            </h2>
          </div>
          <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                wishlisted={wishlist.has(p.id)}
                path="/"
              />
            ))}
          </div>
          {categories[0] && (
            <div className="mt-16 text-center">
              <Link
                href={shopHref}
                className="border border-ink px-10 py-4 text-[11px] uppercase tracking-[0.25em] text-ink transition-colors hover:bg-ink hover:text-cream"
              >
                View all
              </Link>
            </div>
          )}
        </section>
      ) : (
        <section className="mx-auto max-w-2xl px-5 py-32 text-center">
          <h2 className="font-serif text-3xl font-light text-ink">
            New pieces arriving soon
          </h2>
          <p className="mt-4 text-ink/60">
            Our first collection is being photographed now.
          </p>
        </section>
      )}
    </>
  );
}
