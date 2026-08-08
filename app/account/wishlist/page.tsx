import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getWishlistProductIds } from "@/lib/wishlist";
import { getProductsByIds, isSoldOut } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { AddToCartFromWishlist } from "@/components/AddToCartFromWishlist";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your wishlist" };

export default async function WishlistPage() {
  await requireUser();

  const ids = await getWishlistProductIds();
  const products = await getProductsByIds([...ids]);

  return (
    <div className="min-h-dvh bg-[#0b0906] px-5 py-16">
      <div className="mx-auto max-w-7xl">
        <h1 className="font-serif text-4xl font-light text-[#f3e6cc]">
          Your Wishlist
        </h1>
        <p className="mt-3 text-[#f3e6cc]/60">
          {products.length} {products.length === 1 ? "piece" : "pieces"} saved
        </p>

        {products.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[#f3e6cc]/60">Nothing saved yet.</p>
            <Link
              href="/"
              className="mt-8 inline-block border border-[#c59e5a] px-10 py-4 text-[11px] uppercase tracking-[0.25em] text-[#f3e6cc]"
            >
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {products.map((p) => (
              <div key={p.id}>
                <ProductCard
                  product={p}
                  wishlisted
                  path="/account/wishlist"
                  dark
                />
                {!isSoldOut(p) && (
                  <AddToCartFromWishlist
                    productId={p.id}
                    slug={p.slug}
                    name={p.name}
                    pricePaise={p.price_paise}
                    imagePath={p.product_images[0]?.storage_path ?? null}
                    variants={p.product_variants.map((v) => ({
                      id: v.id,
                      size: v.size,
                      stock: v.stock,
                    }))}
                  />
                )}
              </div>
            ))}
          </div>
        )}
        {products.some((p) => isSoldOut(p)) && (
          <p className="mt-8 text-xs text-[#f3e6cc]/40">
            Sold-out pieces stay on your wishlist — remove the heart to take
            them off.
          </p>
        )}
      </div>
    </div>
  );
}
