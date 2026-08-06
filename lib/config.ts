// Every brand-level value the storefront renders lives here, so changing the
// name or the shipping rule is one edit rather than a grep.

/**
 * While true, the site shows the coming-soon page and hides the shop chrome.
 * Flip by setting NEXT_PUBLIC_SHOP_OPEN=true in Vercel and redeploying — no
 * code change needed on launch day.
 */
export const COMING_SOON = process.env.NEXT_PUBLIC_SHOP_OPEN !== "true";

export const BRAND = {
  /** Header/footer wordmark. Rendered uppercase with wide letter-spacing. */
  name: "Nivi Collections",
  legalName: "Nivi Collections",
  tagline: "Timeless elegance, woven for you",
  // TODO(harsha): confirm the address customers should write to.
  email: "hello@nivicollections.com",
  supportHours: "Mon to Sat, 10am to 6pm IST",
};

export const SHIPPING = {
  /** Orders at or above this cart subtotal ship free. */
  freeAbovePaise: 150_000, // ₹1,500
  /** Charged when the subtotal is below the threshold. */
  flatRatePaise: 9_900, // ₹99
};

/** Shipping charge for a given subtotal, in paise. */
export function shippingFor(subtotalPaise: number): number {
  if (subtotalPaise <= 0) return 0;
  return subtotalPaise >= SHIPPING.freeAbovePaise ? 0 : SHIPPING.flatRatePaise;
}

/**
 * Public URL for an image in the `product-images` bucket. Lives here rather
 * than in catalog.ts so Client Components can call it without dragging the
 * server-only Supabase client into the browser bundle.
 */
export function imageUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/product-images/${storagePath}`;
}

/** Paise to a display string: 849000 -> "₹ 8,490.00 INR" */
export function formatINR(paise: number): string {
  const rupees = paise / 100;
  return `₹ ${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} INR`;
}
