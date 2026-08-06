// Every brand-level value the storefront renders lives here, so changing the
// name or the shipping rule is one edit rather than a grep.

/**
 * Legally binding details. These appear verbatim in the policy pages that
 * Razorpay checks during account activation, and that customers rely on in a
 * dispute — so every TODO below must be replaced with real information before
 * the store takes an order. Do not guess at any of them.
 */
export const BUSINESS = {
  // TODO(harsha): registered business name, if different from the brand.
  legalEntity: "Nivi Collections",
  address: "Street 5, Boduppal, Chengicherla, Secunderabad, Telangana 500092",
  phone: "+91 93939 79892",
  // TODO(harsha): GSTIN, or set to null if not yet registered.
  gstin: null as string | null,
  /** Days from delivery within which a return may be raised. */
  // TODO(harsha): confirm — 7 or 15 days.
  returnWindowDays: 7,
  /** Working days to dispatch a ready-to-ship piece. */
  dispatchDays: "2 to 3",
  /** Working days for a refund to reach the original payment method. */
  refundDays: "5 to 7",
};

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
