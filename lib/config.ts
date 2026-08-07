// Brand-level values with no live/admin-editable equivalent. Anything a
// customer relies on for a dispute (legal name, address, GSTIN, return
// window, shipping rates, support phone) lives in store_settings instead —
// see lib/settings.ts — so it can never silently drift from what an admin
// set in /admin/settings.
export const BRAND = {
  /** Header/footer wordmark. Rendered uppercase with wide letter-spacing. */
  name: "Nivi Collections",
  legalName: "Nivi Collections",
  tagline: "Timeless elegance, woven for you",
  email: "contact@nivicollections.com",
  supportHours: "Mon to Sat, 10am to 6pm IST",
};

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
