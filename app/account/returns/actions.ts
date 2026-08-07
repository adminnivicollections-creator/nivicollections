"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { getStoreSettings } from "@/lib/settings";
import { isReturnEligible } from "@/lib/returns";

export type ActionResult = { error: string } | undefined;

const schema = z.object({
  reason: z.enum(["defective", "wrong_item", "changed_mind", "other"]),
  description: z.string().trim().max(1000).default(""),
});

const MAX_PHOTOS = 4;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function submitReturnRequest(
  orderId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUser();

  const parsed = schema.safeParse({
    reason: formData.get("reason"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return { error: z.prettifyError(parsed.error) };

  const admin = createAdminClient();

  const { data: order, error: findError } = await admin
    .from("orders")
    .select("id, user_id, status, delivered_at")
    .eq("id", orderId)
    .maybeSingle();
  if (findError) return { error: findError.message };
  // Ownership check happens here, not just in RLS — this action runs with
  // the service role, which bypasses RLS entirely.
  if (!order || order.user_id !== userId) return { error: "Order not found." };

  const settings = await getStoreSettings();
  if (!isReturnEligible(order, settings)) {
    return {
      error: `Only delivered orders within the ${settings.return_window_days}-day return window are eligible.`,
    };
  }

  const { data: existing } = await admin
    .from("return_requests")
    .select("id")
    .eq("order_id", orderId)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) return { error: "A return request for this order is already pending." };

  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_PHOTOS) {
    return { error: `Attach up to ${MAX_PHOTOS} photos.` };
  }

  const photoPaths: string[] = [];
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: "Only JPEG, PNG or WebP photos are accepted." };
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return { error: "Each photo must be under 5MB." };
    }
    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${orderId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await admin.storage
      .from("return-photos")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) return { error: uploadError.message };
    photoPaths.push(path);
  }

  const { error: insertError } = await admin.from("return_requests").insert({
    order_id: orderId,
    reason: parsed.data.reason,
    description: parsed.data.description,
    photo_paths: photoPaths,
  });
  if (insertError) {
    return {
      error:
        insertError.code === "23505"
          ? "A return request for this order is already pending."
          : insertError.message,
    };
  }

  revalidatePath("/account");
  revalidatePath(`/account/returns/${orderId}`);
  redirect("/account");
}
