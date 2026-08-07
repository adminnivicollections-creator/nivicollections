"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

export type ActionResult = { error: string } | undefined;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const linkSchema = z
  .string()
  .trim()
  .regex(/^\/\S*$/, "Must be an internal path starting with /, e.g. /collections/sarees")
  .max(200)
  .optional();

export async function uploadHomepageSlide(
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

  const parsedLink = linkSchema.safeParse(formData.get("linkHref") || undefined);
  if (!parsedLink.success) return { error: z.prettifyError(parsedLink.error) };

  const admin = createAdminClient();
  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `homepage/slide-${Date.now()}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: uploadError.message };

  const { count } = await admin
    .from("homepage_slides")
    .select("id", { count: "exact", head: true });

  const { error } = await admin.from("homepage_slides").insert({
    image_path: path,
    link_href: parsedLink.data || null,
    position: count ?? 0,
  });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return undefined;
}

export async function deleteHomepageSlide(slideId: string): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: slide, error: findError } = await admin
    .from("homepage_slides")
    .select("image_path")
    .eq("id", slideId)
    .single();
  if (findError) throw findError;

  await admin.storage.from("product-images").remove([slide.image_path]);
  const { error } = await admin.from("homepage_slides").delete().eq("id", slideId);
  if (error) throw error;

  revalidatePath("/", "layout");
}

/** Swaps this slide's position with its neighbour in the given direction. */
export async function moveHomepageSlide(
  slideId: string,
  direction: "up" | "down",
): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: slides, error } = await admin
    .from("homepage_slides")
    .select("id, position")
    .order("position");
  if (error) throw error;

  const index = slides.findIndex((s) => s.id === slideId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= slides.length) return;

  const a = slides[index];
  const b = slides[swapWith];

  await Promise.all([
    admin.from("homepage_slides").update({ position: b.position }).eq("id", a.id),
    admin.from("homepage_slides").update({ position: a.position }).eq("id", b.id),
  ]);

  revalidatePath("/", "layout");
}
