import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { Coupon } from "./supabase/types";

export type CouponLine = {
  variantId: string;
  unitPricePaise: number;
  qty: number;
};

export type CouponValidation =
  | { ok: true; coupon: Coupon; discountPaise: number; freeShipping: boolean }
  | { ok: false; error: string };

/**
 * The only place a discount is computed. Called from /api/checkout with
 * server-known line items (variant id, real price, qty) — never trust a
 * discount amount, or even a subtotal, sent by the browser. Cart lines
 * rather than just a subtotal because buy_x_get_y needs to see per-product
 * quantities, not just the total.
 */
export async function validateCoupon(
  rawCode: string,
  lines: CouponLine[],
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

  const subtotalPaise = lines.reduce((sum, l) => sum + l.unitPricePaise * l.qty, 0);
  if (subtotalPaise < coupon.min_subtotal_paise) {
    return {
      ok: false,
      error: `This code needs a cart of at least ${(coupon.min_subtotal_paise / 100).toLocaleString("en-IN")} rupees.`,
    };
  }

  let discountPaise = 0;
  const freeShipping = coupon.discount_type === "free_shipping";

  if (coupon.discount_type === "percent") {
    discountPaise = Math.round((subtotalPaise * (coupon.discount_value ?? 0)) / 100);
  } else if (coupon.discount_type === "flat") {
    discountPaise = coupon.discount_value ?? 0;
  } else if (coupon.discount_type === "buy_x_get_y") {
    const groupSize = (coupon.buy_qty ?? 0) + (coupon.get_qty ?? 0);
    if (groupSize > 0) {
      for (const line of lines) {
        const freeUnits = Math.floor(line.qty / groupSize) * (coupon.get_qty ?? 0);
        discountPaise += freeUnits * line.unitPricePaise;
      }
    }
    if (discountPaise === 0) {
      return {
        ok: false,
        error: `Add ${groupSize} or more of the same item to use this code.`,
      };
    }
  }
  // free_shipping has no subtotal discount component — discountPaise stays 0,
  // freeShipping carries the actual benefit.

  if (coupon.max_discount_paise !== null) {
    discountPaise = Math.min(discountPaise, coupon.max_discount_paise);
  }
  // A discount can never exceed what is being bought.
  discountPaise = Math.min(discountPaise, subtotalPaise);

  return { ok: true, coupon, discountPaise, freeShipping };
}
