"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart";
import { formatINR, imageUrl } from "@/lib/config";

type RazorpayInstance = { open: () => void };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const RAZORPAY_SDK = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SDK;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the payment window."));
    document.body.appendChild(script);
  });
}

export function CheckoutForm({
  freeShippingAbovePaise,
  flatShippingPaise,
}: {
  freeShippingAbovePaise: number;
  flatShippingPaise: number;
}) {
  const router = useRouter();
  const { lines, subtotalPaise, clear, hydrated } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discountPaise: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);

  if (!hydrated) return <div className="py-20" aria-busy="true" />;

  if (lines.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-[#f3e6cc]/60">Your cart is empty.</p>
        <Link
          href="/"
          className="mt-8 inline-block border border-[#c59e5a] px-10 py-4 text-[11px] uppercase tracking-[0.25em] text-[#f3e6cc]"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  const discount = coupon?.discountPaise ?? 0;
  const shipping =
    subtotalPaise <= 0 || subtotalPaise >= freeShippingAbovePaise ? 0 : flatShippingPaise;
  const total = subtotalPaise - discount + shipping;

  async function applyCoupon() {
    setCouponError(null);
    if (!couponInput.trim()) return;
    setCouponBusy(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput, subtotalPaise }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCoupon(null);
        setCouponError(data.error ?? "Could not apply that code.");
      } else {
        setCoupon({ code: data.code, discountPaise: data.discountPaise });
      }
    } catch {
      setCouponError("Could not apply that code.");
    } finally {
      setCouponBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const fd = new FormData(e.currentTarget);
    const payload = {
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      address: {
        full_name: String(fd.get("full_name") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        line1: String(fd.get("line1") ?? ""),
        line2: String(fd.get("line2") ?? ""),
        city: String(fd.get("city") ?? ""),
        state: String(fd.get("state") ?? ""),
        pincode: String(fd.get("pincode") ?? ""),
        country: "India" as const,
      },
      // Only ids and quantities travel; the server prices the order itself.
      items: lines.map((l) => ({ variantId: l.variantId, qty: l.qty })),
      couponCode: coupon?.code,
      notes: String(fd.get("notes") ?? ""),
      giftWrap: fd.get("giftWrap") === "on",
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not start checkout.");
        setBusy(false);
        return;
      }

      await loadRazorpay();
      const rzp = new window.Razorpay!({
        key: data.keyId,
        order_id: data.razorpayOrderId,
        amount: data.amountPaise,
        currency: "INR",
        name: "Nivi Collections",
        description: `Order ${data.orderNumber}`,
        prefill: {
          name: payload.address.full_name,
          email: payload.email,
          contact: payload.phone,
        },
        theme: { color: "#c59e5a" },
        handler: () => {
          // The webhook is what actually marks the order paid; this only
          // moves the customer along.
          clear();
          router.push(`/checkout/success?order=${data.orderNumber}`);
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setError("Payment was cancelled. Your cart is still here.");
          },
        },
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  const field =
    "mt-1 w-full border border-[#c59e5a]/30 bg-transparent px-4 py-3 text-sm text-[#f3e6cc] outline-none placeholder:text-[#f3e6cc]/30 focus:border-[#c59e5a]";
  const label = "text-[11px] uppercase tracking-[0.2em] text-[#f3e6cc]/60";

  return (
    <div className="mt-12 grid gap-16 md:grid-cols-[1fr_20rem]">
      <form onSubmit={onSubmit} className="space-y-5">
        <h2 className="font-serif text-2xl font-light text-[#f3e6cc]">
          Delivery details
        </h2>

        <div>
          <label htmlFor="full_name" className={label}>Full name</label>
          <input id="full_name" name="full_name" required autoComplete="name" className={field} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className={label}>Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" className={field} />
          </div>
          <div>
            <label htmlFor="phone" className={label}>Phone</label>
            <input id="phone" name="phone" type="tel" required autoComplete="tel" className={field} />
          </div>
        </div>

        <div>
          <label htmlFor="line1" className={label}>Address</label>
          <input id="line1" name="line1" required autoComplete="address-line1" className={field} />
        </div>
        <div>
          <label htmlFor="line2" className={label}>Apartment, landmark (optional)</label>
          <input id="line2" name="line2" autoComplete="address-line2" className={field} />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="city" className={label}>City</label>
            <input id="city" name="city" required autoComplete="address-level2" className={field} />
          </div>
          <div>
            <label htmlFor="state" className={label}>State</label>
            <input id="state" name="state" required autoComplete="address-level1" className={field} />
          </div>
          <div>
            <label htmlFor="pincode" className={label}>Pincode</label>
            <input
              id="pincode"
              name="pincode"
              required
              inputMode="numeric"
              pattern="[1-9][0-9]{5}"
              autoComplete="postal-code"
              className={field}
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className={label}>
            Order notes (optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            maxLength={500}
            placeholder="A note for the packer — a preferred delivery time, a message for a gift, etc."
            className={field}
          />
        </div>

        <label className="flex items-center gap-3 text-sm text-[#f3e6cc]">
          <input
            type="checkbox"
            name="giftWrap"
            className="h-4 w-4 accent-[#c59e5a]"
          />
          Gift wrap this order
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-[#c59e5a] py-4 text-[11px] uppercase tracking-[0.25em] text-[#0b0906] disabled:opacity-40"
        >
          {busy ? "Opening payment…" : `Pay ${formatINR(total)}`}
        </button>
        <p className="text-xs text-[#f3e6cc]/40">
          Payments are handled by Razorpay. Card details never reach this site.
        </p>
      </form>

      <aside className="h-fit border border-[#c59e5a]/20 p-6">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-[#f3e6cc]/60">
          Your order
        </h2>
        <ul className="mt-5 space-y-4">
          {lines.map((l) => (
            <li key={l.variantId} className="flex items-center gap-4 text-sm text-[#f3e6cc]">
              <div className="relative h-14 w-12 shrink-0 overflow-hidden bg-[#c59e5a]/10">
                {l.imagePath && (
                  <Image
                    src={imageUrl(l.imagePath)}
                    alt={l.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                )}
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c59e5a] px-1 text-[9px] font-medium text-[#0b0906]">
                  {l.qty}
                </span>
              </div>
              <span className="flex-1 text-[#f3e6cc]/70">
                {l.name}
                <span className="block text-xs text-[#f3e6cc]/40">
                  Size {l.size}
                </span>
              </span>
              <span>{formatINR(l.pricePaise * l.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 border-t border-[#c59e5a]/20 pt-4">
          {coupon ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#c59e5a]">{coupon.code} applied</span>
              <button
                type="button"
                onClick={() => {
                  setCoupon(null);
                  setCouponInput("");
                }}
                className="text-xs text-[#f3e6cc]/50 underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <label htmlFor="coupon" className="sr-only">
                Coupon code
              </label>
              <input
                id="coupon"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Coupon code"
                className="min-w-0 flex-1 border border-[#c59e5a]/30 bg-transparent px-3 py-2 text-sm uppercase text-[#f3e6cc] outline-none placeholder:text-[#f3e6cc]/30 focus:border-[#c59e5a]"
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={couponBusy || !couponInput.trim()}
                className="shrink-0 border border-[#c59e5a] px-4 py-2 text-[11px] uppercase tracking-[0.15em] text-[#f3e6cc] disabled:opacity-40"
              >
                {couponBusy ? "…" : "Apply"}
              </button>
            </div>
          )}
          {couponError && (
            <p className="mt-2 text-xs text-red-400">{couponError}</p>
          )}
        </div>

        <dl className="mt-4 space-y-2 border-t border-[#c59e5a]/20 pt-4 text-sm text-[#f3e6cc]">
          <div className="flex justify-between">
            <dt className="text-[#f3e6cc]/60">Subtotal</dt>
            <dd>{formatINR(subtotalPaise)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-[#c59e5a]">
              <dt>Discount</dt>
              <dd>−{formatINR(discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-[#f3e6cc]/60">Shipping</dt>
            <dd>{shipping === 0 ? "Free" : formatINR(shipping)}</dd>
          </div>
          <div className="flex justify-between border-t border-[#c59e5a]/20 pt-2 text-base">
            <dt>Total</dt>
            <dd>{formatINR(total)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
