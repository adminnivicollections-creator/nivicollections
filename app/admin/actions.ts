"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import type { Product, ProductVariant } from "@/lib/supabase/types";

// Server Actions are public HTTP endpoints, so every one of these re-checks
// admin rather than trusting that the caller came from the admin UI.

const sizeRow = z.object({
  size: z.string().trim().min(1).max(20),
  stock: z.coerce.number().int().min(0).max(10_000),
});

const productSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only")
    .max(200),
  description: z.string().trim().max(5000).default(""),
  categoryId: z.uuid(),
  sku: z.string().trim().max(60).optional(),
  barcode: z.string().trim().max(60).optional(),
  // Entered in rupees, stored in paise.
  priceRupees: z.coerce.number().min(0).max(10_000_000),
  compareAtRupees: z.coerce.number().min(0).max(10_000_000).optional(),
  readyToShip: z.coerce.boolean().default(false),
  active: z.coerce.boolean().default(true),
  variants: z.array(sizeRow).min(1, "Add at least one size"),
});

function parseVariants(formData: FormData) {
  const sizes = formData.getAll("size").map(String);
  const stocks = formData.getAll("stock").map(String);
  return sizes
    .map((size, i) => ({ size: size.trim(), stock: stocks[i] ?? "0" }))
    .filter((v) => v.size !== "");
}

function readProductForm(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") ?? "",
    categoryId: formData.get("categoryId"),
    sku: formData.get("sku") || undefined,
    barcode: formData.get("barcode") || undefined,
    priceRupees: formData.get("priceRupees"),
    compareAtRupees: formData.get("compareAtRupees") || undefined,
    readyToShip: formData.get("readyToShip") === "on",
    active: formData.get("active") === "on",
    variants: parseVariants(formData),
  });
}

export type ActionResult = { error: string } | undefined;

function describeUniqueViolation(error: { code?: string; message: string }): string {
  if (error.code !== "23505") return error.message;
  if (error.message.includes("sku")) return "That SKU is already used by another product.";
  return "That URL slug is already used by another product.";
}

export async function createProduct(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = readProductForm(formData);
  if (!parsed.success) {
    return { error: z.prettifyError(parsed.error) };
  }
  const p = parsed.data;
  if (p.compareAtRupees && p.compareAtRupees <= p.priceRupees) {
    return { error: "Compare-at price must be higher than the price." };
  }

  const supabase = createAdminClient();
  const { data: product, error } = await supabase
    .from("products")
    .insert({
      name: p.name,
      slug: p.slug,
      description: p.description,
      category_id: p.categoryId,
      sku: p.sku || null,
      barcode: p.barcode || null,
      price_paise: Math.round(p.priceRupees * 100),
      compare_at_paise: p.compareAtRupees
        ? Math.round(p.compareAtRupees * 100)
        : null,
      ready_to_ship: p.readyToShip,
      active: p.active,
    })
    .select("id")
    .single();

  if (error) {
    return { error: describeUniqueViolation(error) };
  }

  const { error: variantError } = await supabase.from("product_variants").insert(
    p.variants.map((v, i) => ({
      product_id: product.id,
      size: v.size,
      stock: v.stock,
      position: i,
    })),
  );
  if (variantError) return { error: variantError.message };

  revalidatePath("/", "layout");
  redirect(`/admin/products/${product.id}`);
}

export async function updateProduct(
  productId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = readProductForm(formData);
  if (!parsed.success) return { error: z.prettifyError(parsed.error) };
  const p = parsed.data;
  if (p.compareAtRupees && p.compareAtRupees <= p.priceRupees) {
    return { error: "Compare-at price must be higher than the price." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("products")
    .update({
      name: p.name,
      slug: p.slug,
      description: p.description,
      category_id: p.categoryId,
      sku: p.sku || null,
      barcode: p.barcode || null,
      price_paise: Math.round(p.priceRupees * 100),
      compare_at_paise: p.compareAtRupees
        ? Math.round(p.compareAtRupees * 100)
        : null,
      ready_to_ship: p.readyToShip,
      active: p.active,
    })
    .eq("id", productId);

  if (error) {
    return { error: describeUniqueViolation(error) };
  }

  // Sizes are replaced wholesale, but only after re-inserting succeeds would
  // be ideal; instead upsert the incoming rows and delete the ones dropped, so
  // an existing size keeps its id (and any order_items pointing at it).
  const keep = p.variants.map((v) => v.size);
  const { error: upsertError } = await supabase.from("product_variants").upsert(
    p.variants.map((v, i) => ({
      product_id: productId,
      size: v.size,
      stock: v.stock,
      position: i,
    })),
    { onConflict: "product_id,size" },
  );
  if (upsertError) return { error: upsertError.message };

  const { error: deleteError } = await supabase
    .from("product_variants")
    .delete()
    .eq("product_id", productId)
    .not("size", "in", `(${keep.map((s) => `"${s}"`).join(",")})`);
  if (deleteError) return { error: deleteError.message };

  revalidatePath("/", "layout");
  return undefined;
}

export async function deleteProduct(productId: string): Promise<void> {
  await requireAdmin();
  const supabase = createAdminClient();

  // Hard delete would orphan order history, so retire the product instead.
  const { error } = await supabase
    .from("products")
    .update({ active: false })
    .eq("id", productId);
  if (error) throw error;

  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function duplicateProduct(productId: string): Promise<void> {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: original, error: findError } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("id", productId)
    .single()
    .overrideTypes<Product & { product_variants: ProductVariant[] }>();
  if (findError) throw findError;

  // Slug must stay unique; try "-copy", then "-copy-2", "-copy-3", ...
  let slug = `${original.slug}-copy`;
  let suffix = 2;
  for (;;) {
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${original.slug}-copy-${suffix++}`;
  }

  const { data: copy, error: insertError } = await supabase
    .from("products")
    .insert({
      name: `${original.name} (Copy)`,
      slug,
      description: original.description,
      category_id: original.category_id,
      // sku/barcode are not copied — they're unique per product, and a
      // duplicate needs its own before it can go live.
      price_paise: original.price_paise,
      compare_at_paise: original.compare_at_paise,
      ready_to_ship: original.ready_to_ship,
      // Hidden until the admin actually reviews it, so a duplicate never
      // goes live half-edited.
      active: false,
    })
    .select("id")
    .single();
  if (insertError) throw insertError;

  if (original.product_variants.length > 0) {
    const { error: variantError } = await supabase.from("product_variants").insert(
      original.product_variants.map((v: { size: string; position: number }, i: number) => ({
        product_id: copy.id,
        size: v.size,
        // Not copied: the duplicate is a new listing, not a second claim on
        // the original's physical stock.
        stock: 0,
        position: i,
      })),
    );
    if (variantError) throw variantError;
  }

  revalidatePath("/", "layout");
  redirect(`/admin/products/${copy.id}`);
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadProductImage(
  productId: string,
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

  const supabase = createAdminClient();
  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${productId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: uploadError.message };

  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    storage_path: path,
    position: count ?? 0,
  });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return undefined;
}

export async function deleteProductImage(imageId: string): Promise<void> {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: image, error: findError } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("id", imageId)
    .single();
  if (findError) throw findError;

  await supabase.storage.from("product-images").remove([image.storage_path]);
  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId);
  if (error) throw error;

  revalidatePath("/", "layout");
}
