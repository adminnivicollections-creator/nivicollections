"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useCart } from "@/lib/cart";
import { formatINR, imageUrl } from "@/lib/config";

export function CartDrawer() {
  const { lines, subtotalPaise, setQty, remove, drawerOpen, closeDrawer, hydrated } =
    useCart();

  // Escape closes the drawer, and it must not survive a client-side nav.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen, closeDrawer]);

  if (!hydrated || !drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        aria-label="Close cart"
        onClick={closeDrawer}
        className="absolute inset-0 bg-black/50"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#0b0906] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#c59e5a]/15 px-6 py-5">
          <h2 className="font-serif text-xl font-light text-[#f3e6cc]">
            Your cart
          </h2>
          <button
            aria-label="Close cart"
            onClick={closeDrawer}
            className="text-2xl leading-none text-[#f3e6cc]/60 hover:text-[#f3e6cc]"
          >
            ×
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-[#f3e6cc]/60">Your cart is empty.</p>
            <button
              onClick={closeDrawer}
              className="border border-[#c59e5a] px-8 py-3 text-[11px] uppercase tracking-[0.25em] text-[#f3e6cc]"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-[#c59e5a]/10 overflow-y-auto px-6">
              {lines.map((line) => (
                <li key={line.variantId} className="flex gap-4 py-5">
                  <Link
                    href={`/products/${line.slug}`}
                    onClick={closeDrawer}
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
                        onClick={closeDrawer}
                        className="text-sm text-[#f3e6cc]"
                      >
                        {line.name}
                      </Link>
                      <p className="mt-1 text-xs text-[#f3e6cc]/50">
                        Size {line.size}
                      </p>
                      <p className="mt-1 text-sm text-[#f3e6cc]">
                        {formatINR(line.pricePaise)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-[#c59e5a]/30">
                        <button
                          onClick={() => setQty(line.variantId, line.qty - 1)}
                          aria-label={`Decrease quantity of ${line.name}`}
                          className="px-2.5 py-1 text-[#f3e6cc]"
                        >
                          −
                        </button>
                        <span className="min-w-7 text-center text-sm text-[#f3e6cc]">
                          {line.qty}
                        </span>
                        <button
                          onClick={() => setQty(line.variantId, line.qty + 1)}
                          aria-label={`Increase quantity of ${line.name}`}
                          className="px-2.5 py-1 text-[#f3e6cc]"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => remove(line.variantId)}
                        aria-label={`Remove ${line.name}`}
                        className="text-[#f3e6cc]/40 hover:text-[#f3e6cc]"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                          <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-[#c59e5a]/15 px-6 py-5">
              <div className="flex justify-between text-sm text-[#f3e6cc]">
                <span className="text-[#f3e6cc]/60">Estimated total</span>
                <span>{formatINR(subtotalPaise)}</span>
              </div>
              <p className="mt-1 text-xs text-[#f3e6cc]/40">
                Taxes, discounts and shipping calculated at checkout.
              </p>
              <Link
                href="/checkout"
                onClick={closeDrawer}
                className="mt-4 block w-full bg-[#c59e5a] py-4 text-center text-[11px] uppercase tracking-[0.25em] text-[#0b0906]"
              >
                Check out
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
