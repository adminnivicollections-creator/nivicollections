import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { Coupon } from "./supabase/types";

export type CouponValidation =
  | { ok: true; coupon: Coupon; discountPaise: number }
  | { ok: false; error: string };

/**
 * The only place a discount is computed. Called from /api/checkout with a
 * server-known subtotal — never trust a discount amount sent by the browser.
 */
export async function validateCoupon(
  rawCode: string,
  subtotalPaise: number,
): Promise<CouponValidation> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a coupon code." };

  const { data: coupon, error } = await createAdminClient()
    .from("coupons")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) return { ok: false, error: "Could not check that code." };
  if (!coupon || !coupon.active) {
    return { ok: false, error: "That coupon code is not valid." };
  }

  const now = Date.now();
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) {
    return { ok: false, error: "That coupon is not active yet." };
  }
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) {
    return { ok: false, error: "That coupon has expired." };
  }
  if (
    coupon.max_redemptions !== null &&
    coupon.times_redeemed >= coupon.max_redemptions
  ) {
    return { ok: false, error: "That coupon has been fully redeemed." };
  }
  if (subtotalPaise < coupon.min_subtotal_paise) {
    return {
      ok: false,
      error: `This code needs a cart of at least ${(coupon.min_subtotal_paise / 100).toLocaleString("en-IN")} rupees.`,
    };
  }

  let discountPaise =
    coupon.discount_type === "percent"
      ? Math.round((subtotalPaise * coupon.discount_value) / 100)
      : coupon.discount_value;

  if (coupon.max_discount_paise !== null) {
    discountPaise = Math.min(discountPaise, coupon.max_discount_paise);
  }
  // A discount can never exceed what is being bought.
  discountPaise = Math.min(discountPaise, subtotalPaise);

  return { ok: true, coupon, discountPaise };
}
