"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart, type CartLine } from "@/lib/cart";
import { formatINR, imageUrl } from "@/lib/config";

export function CartClient({
  freeShippingAbovePaise,
  flatShippingPaise,
}: {
  freeShippingAbovePaise: number;
  flatShippingPaise: number;
}) {
  const {
    lines,
    saved,
    subtotalPaise,
    setQty,
    remove,
    saveForLater,
    moveToCart,
    removeSaved,
    hydrated,
  } = useCart();

  if (!hydrated) {
    return <div className="min-h-dvh bg-[#0b0906]" aria-busy="true" />;
  }

  if (lines.length === 0 && saved.length === 0) {
    return (
      <div className="min-h-dvh bg-[#0b0906] px-5 py-32 text-center">
        <h1 className="font-serif text-4xl font-light text-[#f3e6cc]">
          Your Cart
        </h1>
        <p className="mt-4 text-[#f3e6cc]/60">Nothing here yet.</p>
        <Link
          href="/"
          className="mt-10 inline-block border border-[#c59e5a] px-10 py-4 text-[11px] uppercase tracking-[0.25em] text-[#f3e6cc] transition-colors hover:bg-[#c59e5a] hover:text-[#0b0906]"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  const shipping =
    subtotalPaise <= 0 || subtotalPaise >= freeShippingAbovePaise ? 0 : flatShippingPaise;
  const shortfall = freeShippingAbovePaise - subtotalPaise;

  return (
    <div className="min-h-dvh bg-[#0b0906] px-5 py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-serif text-4xl font-light text-[#f3e6cc]">
          Your Cart
        </h1>

        {lines.length === 0 ? (
          <p className="mt-6 text-[#f3e6cc]/60">
            Your cart is empty. You have {saved.length} piece
            {saved.length === 1 ? "" : "s"} saved for later below.
          </p>
        ) : (
          <>
            <ul className="mt-12 divide-y divide-[#c59e5a]/15 border-y border-[#c59e5a]/15">
              {lines.map((line) => (
                <li key={line.variantId} className="flex gap-5 py-6">
                  <Link
                    href={`/products/${line.slug}`}
                    className="relative h-32 w-24 shrink-0 overflow-hidden bg-[#c59e5a]/10"
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
                        className="font-serif text-base text-[#f3e6cc]"
                      >
                        {line.name}
                      </Link>
                      <p className="mt-1 text-sm text-[#f3e6cc]/60">
                        Size {line.size}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <div className="flex items-center border border-[#c59e5a]/30">
                        <button
                          onClick={() => setQty(line.variantId, line.qty - 1)}
                          aria-label={`Decrease quantity of ${line.name}`}
                          className="px-3 py-1 text-[#f3e6cc]"
                        >
                          −
                        </button>
                        <span className="min-w-8 text-center text-sm text-[#f3e6cc]">
                          {line.qty}
                        </span>
                        <button
                          onClick={() => setQty(line.variantId, line.qty + 1)}
                          aria-label={`Increase quantity of ${line.name}`}
                          className="px-3 py-1 text-[#f3e6cc]"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => saveForLater(line.variantId)}
                        className="text-xs uppercase tracking-[0.15em] text-[#c59e5a] hover:text-[#f3e6cc]"
                      >
                        Save for later
                      </button>
                      <button
                        onClick={() => remove(line.variantId)}
                        className="text-xs uppercase tracking-[0.15em] text-[#f3e6cc]/50 hover:text-[#f3e6cc]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-[#f3e6cc]">
                    {formatINR(line.pricePaise * line.qty)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col items-end gap-3">
              <div className="flex w-full max-w-sm justify-between text-sm text-[#f3e6cc]/60">
                <span>Subtotal</span>
                <span className="text-[#f3e6cc]">
                  {formatINR(subtotalPaise)}
                </span>
              </div>
              <div className="flex w-full max-w-sm justify-between text-sm text-[#f3e6cc]/60">
                <span>Shipping</span>
                <span className="text-[#f3e6cc]">
                  {shipping === 0 ? "Free" : formatINR(shipping)}
                </span>
              </div>
              <div className="flex w-full max-w-sm justify-between border-t border-[#c59e5a]/15 pt-3 text-lg">
                <span className="text-[#f3e6cc]/60">Total</span>
                <span className="text-[#f3e6cc]">
                  {formatINR(subtotalPaise + shipping)}
                </span>
              </div>

              {shortfall > 0 && (
                <p className="text-xs text-[#c59e5a]">
                  Add {formatINR(shortfall)} more for free shipping.
                </p>
              )}

              <Link
                href="/checkout"
                className="mt-3 w-full max-w-sm bg-[#c59e5a] py-4 text-center text-[11px] uppercase tracking-[0.25em] text-[#0b0906]"
              >
                Checkout
              </Link>
            </div>
          </>
        )}

        {saved.length > 0 && (
          <div className="mt-20">
            <h2 className="font-serif text-2xl font-light text-[#f3e6cc]">
              Saved for later
            </h2>
            <ul className="mt-6 divide-y divide-[#c59e5a]/15 border-y border-[#c59e5a]/15">
              {saved.map((line: CartLine) => (
                <li key={line.variantId} className="flex gap-5 py-6">
                  <Link
                    href={`/products/${line.slug}`}
                    className="relative h-24 w-20 shrink-0 overflow-hidden bg-[#c59e5a]/10"
                  >
                    {line.imagePath && (
                      <Image
                        src={imageUrl(line.imagePath)}
                        alt={line.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <Link
                        href={`/products/${line.slug}`}
                        className="font-serif text-base text-[#f3e6cc]"
                      >
                        {line.name}
                      </Link>
                      <p className="mt-1 text-sm text-[#f3e6cc]/60">
                        Size {line.size} · {formatINR(line.pricePaise)}
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => moveToCart(line.variantId)}
                        className="text-xs uppercase tracking-[0.15em] text-[#c59e5a] hover:text-[#f3e6cc]"
                      >
                        Move to cart
                      </button>
                      <button
                        onClick={() => removeSaved(line.variantId)}
                        className="text-xs uppercase tracking-[0.15em] text-[#f3e6cc]/50 hover:text-[#f3e6cc]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
