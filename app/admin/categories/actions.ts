"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

export type ActionResult = { error: string } | undefined;

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only")
    .max(100),
  position: z.coerce.number().int().min(0).default(0),
  active: z.coerce.boolean().default(true),
});

export async function createCategory(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = schema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    position: formData.get("position") || 0,
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return { error: z.prettifyError(parsed.error) };

  const { error } = await createAdminClient()
    .from("categories")
    .insert(parsed.data);

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "That URL slug is already used by another category."
          : error.message,
    };
  }

  revalidatePath("/", "layout");
  redirect("/admin/categories");
}

export async function updateCategory(
  categoryId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = schema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    position: formData.get("position") || 0,
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return { error: z.prettifyError(parsed.error) };

  const { error } = await createAdminClient()
    .from("categories")
    .update(parsed.data)
    .eq("id", categoryId);

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "That URL slug is already used by another category."
          : error.message,
    };
  }

  revalidatePath("/", "layout");
  return undefined;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadCategoryImage(
  categoryId: string,
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
    return { error: "That image is over 5MB. Compress it and try again." };
  }

  const admin = createAdminClient();
  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `categories/${categoryId}-${Date.now()}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: uploadError.message };

  const { data: existing } = await admin
    .from("categories")
    .select("image_path")
    .eq("id", categoryId)
    .single();

  const { error } = await admin
    .from("categories")
    .update({ image_path: path })
    .eq("id", categoryId);
  if (error) return { error: error.message };

  // Best-effort cleanup of the old image; a failure here does not affect
  // what the shop displays, since the row now points at the new one.
  if (existing?.image_path) {
    await admin.storage.from("product-images").remove([existing.image_path]);
  }

  revalidatePath("/", "layout");
  return undefined;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();

  // Hide rather than hard-delete: products.category_id references this row
  // with ON DELETE RESTRICT, so a category with products in it cannot be
  // removed anyway. Hiding is the same "retire, don't destroy" pattern used
  // for products.
  const { error } = await admin
    .from("categories")
    .update({ active: false })
    .eq("id", categoryId);
  if (error) throw error;

  revalidatePath("/", "layout");
  redirect("/admin/categories");
}
