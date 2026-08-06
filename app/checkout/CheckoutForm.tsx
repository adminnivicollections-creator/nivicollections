"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatINR, shippingFor } from "@/lib/config";

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

export function CheckoutForm() {
  const router = useRouter();
  const { lines, subtotalPaise, clear, hydrated } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!hydrated) return <div className="py-20" aria-busy="true" />;

  if (lines.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-ink/60">Your cart is empty.</p>
        <Link
          href="/"
          className="mt-8 inline-block border border-ink px-10 py-4 text-[11px] uppercase tracking-[0.25em]"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  const shipping = shippingFor(subtotalPaise);
  const total = subtotalPaise + shipping;

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
        theme: { color: "#241f1b" },
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
    "mt-1 w-full border border-ink/20 bg-transparent px-4 py-3 text-sm outline-none focus:border-ink";
  const label = "text-[11px] uppercase tracking-[0.2em] text-ink/60";

  return (
    <div className="mt-12 grid gap-16 md:grid-cols-[1fr_20rem]">
      <form onSubmit={onSubmit} className="space-y-5">
        <h2 className="font-serif text-2xl font-light">Delivery details</h2>

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

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-ink py-4 text-[11px] uppercase tracking-[0.25em] text-cream disabled:opacity-40"
        >
          {busy ? "Opening payment…" : `Pay ${formatINR(total)}`}
        </button>
        <p className="text-xs text-ink/40">
          Payments are handled by Razorpay. Card details never reach this site.
        </p>
      </form>

      <aside className="h-fit border border-ink/10 p-6">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-ink/60">
          Your order
        </h2>
        <ul className="mt-5 space-y-4">
          {lines.map((l) => (
            <li key={l.variantId} className="flex justify-between gap-4 text-sm">
              <span className="text-ink/70">
                {l.name}
                <span className="block text-xs text-ink/40">
                  Size {l.size} × {l.qty}
                </span>
              </span>
              <span>{formatINR(l.pricePaise * l.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-6 space-y-2 border-t border-ink/10 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink/60">Subtotal</dt>
            <dd>{formatINR(subtotalPaise)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink/60">Shipping</dt>
            <dd>{shipping === 0 ? "Free" : formatINR(shipping)}</dd>
          </div>
          <div className="flex justify-between border-t border-ink/10 pt-2 text-base">
            <dt>Total</dt>
            <dd>{formatINR(total)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
