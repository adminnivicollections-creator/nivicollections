import Link from "next/link";
import { getCategories, getProducts } from "@/lib/catalog";
import { imageUrl } from "@/lib/config";
import { ProductCard } from "@/components/ProductCard";

export const revalidate = 300;

export default async function Home() {
  const [categories, featured] = await Promise.all([
    getCategories(),
    getProducts({ limit: 8 }),
  ]);

  return (
    <>
      <section className="grid md:grid-cols-2">
        <div className="min-h-[60vh] bg-blush md:min-h-[80vh]" />
        <div className="flex flex-col justify-center px-8 py-20 md:px-16">
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold">
            Festive 2026
          </p>
          <h1 className="mt-6 font-serif text-5xl font-light leading-[1.1] text-ink md:text-6xl">
            Heirloom craft,
            <br />
            made for today
          </h1>
          <p className="mt-6 max-w-md leading-relaxed text-ink/70">
            Every piece is cut, embroidered and finished by hand in limited
            runs. No mass production, no repeats.
          </p>
          <Link
            href={
              categories[0] ? `/collections/${categories[0].slug}` : "/cart"
            }
            className="mt-10 w-fit border border-ink px-10 py-4 text-[11px] uppercase tracking-[0.25em] text-ink transition-colors hover:bg-ink hover:text-cream"
          >
            Shop the Collection
          </Link>
        </div>
      </section>

      {/* A single-category shop has nothing to choose between, so the grid
          only earns its space once there is a second collection. */}
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

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-8">
          <h2 className="text-center font-serif text-3xl font-light text-ink">
            Just In
          </h2>
          <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
