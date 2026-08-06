"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

export type ActionResult = { error: string } | undefined;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadHomepageHero(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image first." };
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { error: "Only JPEG, PNG or WebP images are accepted." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "That image is over 8MB. Compress it and try again." };
  }

  const admin = createAdminClient();
  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `homepage/hero-${Date.now()}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: uploadError.message };

  const { data: existing } = await admin
    .from("homepage_settings")
    .select("hero_image_path")
    .eq("id", true)
    .maybeSingle();

  const { error } = await admin
    .from("homepage_settings")
    .update({ hero_image_path: path })
    .eq("id", true);
  if (error) return { error: error.message };

  if (existing?.hero_image_path) {
    await admin.storage.from("product-images").remove([existing.hero_image_path]);
  }

  revalidatePath("/", "layout");
  return undefined;
}

export async function resetHomepageHero(): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("homepage_settings")
    .select("hero_image_path")
    .eq("id", true)
    .maybeSingle();

  const { error } = await admin
    .from("homepage_settings")
    .update({ hero_image_path: null })
    .eq("id", true);
  if (error) throw error;

  if (existing?.hero_image_path) {
    await admin.storage.from("product-images").remove([existing.hero_image_path]);
  }

  revalidatePath("/", "layout");
}
