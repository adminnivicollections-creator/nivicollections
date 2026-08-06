"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart";
import { formatINR, shippingFor, SHIPPING, imageUrl } from "@/lib/config";

export default function CartPage() {
  const { lines, subtotalPaise, setQty, remove, hydrated } = useCart();

  if (!hydrated) {
    return <div className="mx-auto max-w-5xl px-5 py-32" aria-busy="true" />;
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-32 text-center">
        <h1 className="font-serif text-4xl font-light text-ink">Your Cart</h1>
        <p className="mt-4 text-ink/60">Nothing here yet.</p>
        <Link
          href="/"
          className="mt-10 inline-block border border-ink px-10 py-4 text-[11px] uppercase tracking-[0.25em] text-ink transition-colors hover:bg-ink hover:text-cream"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  const shipping = shippingFor(subtotalPaise);
  const shortfall = SHIPPING.freeAbovePaise - subtotalPaise;

  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <h1 className="font-serif text-4xl font-light text-ink">Your Cart</h1>

      <ul className="mt-12 divide-y divide-ink/10 border-y border-ink/10">
        {lines.map((line) => (
          <li key={line.variantId} className="flex gap-5 py-6">
            <Link
              href={`/products/${line.slug}`}
              className="relative h-32 w-24 shrink-0 overflow-hidden bg-blush"
            >
              {line.imagePath && (
                <Image
                  src={imageUrl(line.imagePath)}
                  alt={line.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              )}
            </Link>

            <div className="flex flex-1 flex-col justify-between">
              <div>
                <Link
                  href={`/products/${line.slug}`}
                  className="font-serif text-base text-ink"
                >
                  {line.name}
                </Link>
                <p className="mt-1 text-sm text-ink/60">Size {line.size}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center border border-ink/20">
                  <button
                    onClick={() => setQty(line.variantId, line.qty - 1)}
                    aria-label={`Decrease quantity of ${line.name}`}
                    className="px-3 py-1 text-ink"
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center text-sm">{line.qty}</span>
                  <button
                    onClick={() => setQty(line.variantId, line.qty + 1)}
                    aria-label={`Increase quantity of ${line.name}`}
                    className="px-3 py-1 text-ink"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => remove(line.variantId)}
                  className="text-xs uppercase tracking-[0.15em] text-ink/50 hover:text-ink"
                >
                  Remove
                </button>
              </div>
            </div>

            <p className="text-sm text-ink">
              {formatINR(line.pricePaise * line.qty)}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-col items-end gap-3">
        <div className="flex w-full max-w-sm justify-between text-sm text-ink/60">
          <span>Subtotal</span>
          <span className="text-ink">{formatINR(subtotalPaise)}</span>
        </div>
        <div className="flex w-full max-w-sm justify-between text-sm text-ink/60">
          <span>Shipping</span>
          <span className="text-ink">
            {shipping === 0 ? "Free" : formatINR(shipping)}
          </span>
        </div>
        <div className="flex w-full max-w-sm justify-between border-t border-ink/10 pt-3 text-lg">
          <span className="text-ink/60">Total</span>
          <span className="text-ink">{formatINR(subtotalPaise + shipping)}</span>
        </div>

        {shortfall > 0 && (
          <p className="text-xs text-gold">
            Add {formatINR(shortfall)} more for free shipping.
          </p>
        )}

        <Link
          href="/checkout"
          className="mt-3 w-full max-w-sm bg-ink py-4 text-center text-[11px] uppercase tracking-[0.25em] text-cream"
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}
