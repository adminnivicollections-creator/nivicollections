"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

export type ActionResult = { error: string } | { ok: true } | undefined;

const schema = z.object({
  announcementText: z.string().trim().max(200).default(""),
  legalName: z.string().trim().min(2).max(200),
  supportEmail: z.email(),
  supportPhone: z.string().trim().min(6).max(20),
  address: z.string().trim().min(5).max(500),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[0-9A-Z]{15}$/, "A GSTIN is 15 characters")
    .optional()
    .or(z.literal("")),
  returnWindowDays: z.coerce.number().int().min(1).max(90),
  freeShippingAboveRupees: z.coerce.number().min(0),
  flatShippingRupees: z.coerce.number().min(0),
});

export async function updateStoreSettings(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = schema.safeParse({
    announcementText: formData.get("announcementText") ?? "",
    legalName: formData.get("legalName"),
    supportEmail: formData.get("supportEmail"),
    supportPhone: formData.get("supportPhone"),
    address: formData.get("address"),
    gstin: formData.get("gstin") || "",
    returnWindowDays: formData.get("returnWindowDays"),
    freeShippingAboveRupees: formData.get("freeShippingAboveRupees"),
    flatShippingRupees: formData.get("flatShippingRupees"),
  });
  if (!parsed.success) return { error: z.prettifyError(parsed.error) };
  const d = parsed.data;

  const { error } = await createAdminClient()
    .from("store_settings")
    .update({
      announcement_text: d.announcementText,
      legal_name: d.legalName,
      support_email: d.supportEmail,
      support_phone: d.supportPhone,
      address: d.address,
      gstin: d.gstin || null,
      return_window_days: d.returnWindowDays,
      free_shipping_above_paise: Math.round(d.freeShippingAboveRupees * 100),
      flat_shipping_paise: Math.round(d.flatShippingRupees * 100),
    })
    .eq("id", true);

  if (error) return { error: error.message };

  // Every public page that reads these values is server-rendered, so a full
  // layout revalidation is what actually makes the change visible.
  revalidatePath("/", "layout");
  return { ok: true };
}
