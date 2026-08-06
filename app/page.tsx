import Link from "next/link";
import Image from "next/image";
import { getCategories, getProducts } from "@/lib/catalog";
import { imageUrl, BRAND } from "@/lib/config";
import { ProductCard } from "@/components/ProductCard";

export const revalidate = 300;

export default async function Home() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ limit: 8 }),
  ]);

  // The hero uses real product photography when there is any, so the page
  // never opens on a placeholder once the catalogue is stocked.
  const heroImage = products.find((p) => p.product_images.length > 0)
    ?.product_images[0];

  return (
    <>
      <section className="relative min-h-[75vh] overflow-hidden bg-[#0b0906] md:min-h-[85vh]">
        {heroImage && (
          <Image
            src={imageUrl(heroImage.storage_path)}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-top opacity-60"
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-[#0b0906] via-[#0b0906]/75 to-transparent"
        />

        <div className="relative flex min-h-[75vh] items-center px-6 md:min-h-[85vh] md:px-16">
          <div className="max-w-xl">
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#c59e5a]">
              Handwoven in India
            </p>
            <h1 className="mt-6 font-serif text-5xl font-light leading-[1.05] text-[#f3e6cc] sm:text-6xl md:text-7xl">
              Timeless elegance,
              <br />
              woven for you
            </h1>
            <p className="mt-6 max-w-md leading-relaxed text-[#f3e6cc]/70">
              Every saree is chosen for its drape, its fall and the hands that
              made it. Limited pieces, never repeated.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href={
                  categories[0] ? `/collections/${categories[0].slug}` : "/cart"
                }
                className="bg-[#c59e5a] px-10 py-4 text-[11px] uppercase tracking-[0.25em] text-[#0b0906] transition-opacity hover:opacity-90"
              >
                Shop the collection
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-ink/10 bg-cream">
        <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-y-10 px-6 py-14 text-center md:grid-cols-4">
          {[
            ["Premium quality", "Pure fabrics, finished by hand"],
            ["Exquisite designs", "Motifs drawn from tradition"],
            ["Crafted with care", "Made in small batches"],
            ["Free shipping", "On every order above ₹1,500"],
          ].map(([title, sub]) => (
            <li key={title} className="px-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-gold">
                {title}
              </p>
              <p className="mt-2 text-sm text-ink/60">{sub}</p>
            </li>
          ))}
        </ul>
      </section>

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
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {categories[0] && (
            <div className="mt-16 text-center">
              <Link
                href={`/collections/${categories[0].slug}`}
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

      <section className="bg-[#0b0906] px-6 py-24 text-center">
        <p className="mx-auto max-w-2xl font-serif text-2xl font-light leading-relaxed text-[#f3e6cc] md:text-3xl">
          &ldquo;{BRAND.tagline}&rdquo;
        </p>
        <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-[#c59e5a]">
          {BRAND.legalName}
        </p>
      </section>
    </>
  );
}
