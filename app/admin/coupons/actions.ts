"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

export type ActionResult = { error: string } | undefined;

const schema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{3,20}$/, "Use 3-20 letters and numbers, no spaces"),
    description: z.string().trim().max(200).default(""),
    discountType: z.enum(["percent", "flat"]),
    discountValue: z.coerce.number().int().min(1),
    minSubtotalRupees: z.coerce.number().min(0).default(0),
    maxDiscountRupees: z.coerce.number().min(0).optional(),
    expiresAt: z.string().optional(),
    maxRedemptions: z.coerce.number().int().min(1).optional(),
  })
  .refine((d) => d.discountType !== "percent" || d.discountValue <= 100, {
    message: "A percent discount cannot exceed 100.",
    path: ["discountValue"],
  });

export async function createCoupon(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = schema.safeParse({
    code: formData.get("code"),
    description: formData.get("description") ?? "",
    discountType: formData.get("discountType"),
    discountValue: formData.get("discountValue"),
    minSubtotalRupees: formData.get("minSubtotalRupees") || 0,
    maxDiscountRupees: formData.get("maxDiscountRupees") || undefined,
    expiresAt: formData.get("expiresAt") || undefined,
    maxRedemptions: formData.get("maxRedemptions") || undefined,
  });
  if (!parsed.success) return { error: z.prettifyError(parsed.error) };
  const d = parsed.data;

  const { error } = await createAdminClient().from("coupons").insert({
    code: d.code,
    description: d.description,
    discount_type: d.discountType,
    // Percent is unit-less (1-100); flat is stored in paise like every other
    // money column, but the form collects it in rupees.
    discount_value:
      d.discountType === "flat" ? Math.round(d.discountValue * 100) : d.discountValue,
    min_subtotal_paise: Math.round(d.minSubtotalRupees * 100),
    max_discount_paise:
      d.maxDiscountRupees !== undefined
        ? Math.round(d.maxDiscountRupees * 100)
        : null,
    expires_at: d.expiresAt ? new Date(d.expiresAt).toISOString() : null,
    max_redemptions: d.maxRedemptions ?? null,
  });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "That code already exists."
          : error.message,
    };
  }

  revalidatePath("/admin/coupons");
  return undefined;
}

export async function setCouponActive(
  couponId: string,
  active: boolean,
): Promise<void> {
  await requireAdmin();
  const { error } = await createAdminClient()
    .from("coupons")
    .update({ active })
    .eq("id", couponId);
  if (error) throw error;
  revalidatePath("/admin/coupons");
}
