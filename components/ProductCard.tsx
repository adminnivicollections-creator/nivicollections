import Link from "next/link";
import { formatINR } from "@/lib/config";
import { isSoldOut, type ProductWithMedia } from "@/lib/catalog";
import { ProductMedia } from "./ProductMedia";

export function ProductCard({ product }: { product: ProductWithMedia }) {
  const soldOut = isSoldOut(product);

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative">
        <ProductMedia
          image={product.product_images[0]}
          alt={product.name}
          className="aspect-[3/4] w-full transition-transform duration-500 group-hover:scale-[1.02]"
        />
        {soldOut && (
          <span className="absolute left-3 top-3 bg-ink px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-cream">
            Sold Out
          </span>
        )}
      </div>
      <div className="pt-4">
        <h3 className="font-serif text-sm leading-snug text-ink">
          {product.name}
        </h3>
        <p className="flex items-baseline gap-2 pt-1 text-sm text-ink/70">
          {formatINR(product.price_paise)}
          {product.compare_at_paise && (
            <span className="text-xs text-ink/40 line-through">
              {formatINR(product.compare_at_paise)}
            </span>
          )}
        </p>
        {product.ready_to_ship && !soldOut && (
          <p className="pt-1 text-[11px] uppercase tracking-[0.15em] text-gold">
            Ready to Ship
          </p>
        )}
      </div>
    </Link>
  );
}
