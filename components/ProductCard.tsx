import Link from "next/link";
import { formatINR } from "@/lib/config";
import { isSoldOut, type ProductWithMedia } from "@/lib/catalog";
import { ProductMedia } from "./ProductMedia";
import { WishlistHeart } from "./WishlistHeart";

export function ProductCard({
  product,
  wishlisted = false,
  path = "/",
  dark = false,
}: {
  product: ProductWithMedia;
  wishlisted?: boolean;
  path?: string;
  /** Use on the dark-themed pages (product detail, wishlist). */
  dark?: boolean;
}) {
  const soldOut = isSoldOut(product);
  const text = dark ? "text-[#f3e6cc]" : "text-ink";
  const textMuted = dark ? "text-[#f3e6cc]/70" : "text-ink/70";
  const textFaint = dark ? "text-[#f3e6cc]/40" : "text-ink/40";
  const gold = dark ? "text-[#c59e5a]" : "text-gold";

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative">
        <ProductMedia
          image={product.product_images[0]}
          alt={product.name}
          className="aspect-[3/4] w-full transition-transform duration-500 group-hover:scale-[1.02]"
        />
        {soldOut && (
          <span
            className={`absolute left-3 top-3 px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
              dark ? "bg-[#c59e5a] text-[#0b0906]" : "bg-ink text-cream"
            }`}
          >
            Sold Out
          </span>
        )}
        <WishlistHeart
          productId={product.id}
          initialWishlisted={wishlisted}
          path={path}
          className="absolute right-3 top-3"
        />
      </div>
      <div className="pt-4">
        <h3 className={`font-serif text-sm leading-snug ${text}`}>
          {product.name}
        </h3>
        <p className={`flex items-baseline gap-2 pt-1 text-sm ${textMuted}`}>
          {formatINR(product.price_paise)}
          {product.compare_at_paise && (
            <span className={`text-xs line-through ${textFaint}`}>
              {formatINR(product.compare_at_paise)}
            </span>
          )}
        </p>
        {product.ready_to_ship && !soldOut && (
          <p className={`pt-1 text-[11px] uppercase tracking-[0.15em] ${gold}`}>
            Ready to Ship
          </p>
        )}
      </div>
    </Link>
  );
}
