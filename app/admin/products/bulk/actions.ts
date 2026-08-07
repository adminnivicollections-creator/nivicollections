"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { parseCsv } from "@/lib/csv";

export type BulkUploadResult =
  | { error: string }
  | { created: number; updated: number; errors: { row: number; message: string }[] }
  | undefined;

const MAX_ROWS = 500;
const MAX_FILE_BYTES = 2 * 1024 * 1024;

const sizeRow = z.object({
  size: z.string().trim().min(1).max(20),
  stock: z.coerce.number().int().min(0).max(10_000),
});

const rowSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, numbers and hyphens only")
    .max(200)
    .optional(),
  description: z.string().trim().max(5000).default(""),
  sku: z.string().trim().max(60).optional(),
  barcode: z.string().trim().max(60).optional(),
  priceRupees: z.coerce.number().min(0).max(10_000_000),
  compareAtRupees: z.coerce.number().min(0).max(10_000_000).optional(),
  readyToShip: z.boolean().default(false),
  active: z.boolean().default(true),
  sizes: z.array(sizeRow).min(1, "add at least one size:stock pair"),
});

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function truthy(s: string): boolean {
  return ["yes", "true", "1"].includes(s.trim().toLowerCase());
}

/** "Free Size:5;M:3;L:0" -> [{size:"Free Size",stock:5}, ...] */
function parseSizes(raw: string): { size: string; stock: number }[] {
  return raw
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const [size, stock] = pair.split(":").map((p) => p.trim());
      return { size: size ?? "", stock: Number(stock) };
    });
}

export async function bulkUploadProducts(
  _prev: BulkUploadResult,
  formData: FormData,
): Promise<BulkUploadResult> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a CSV file first." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: "That file is over 2MB." };
  }

  const rows = parseCsv(await file.text());
  if (rows.length < 2) {
    return { error: "The file has no data rows." };
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const dataRows = rows.slice(1);
  if (dataRows.length > MAX_ROWS) {
    return { error: `Upload up to ${MAX_ROWS} rows at a time.` };
  }

  const admin = createAdminClient();
  const { data: categories } = await admin.from("categories").select("id, slug");
  const categoryIdBySlug = new Map((categories ?? []).map((c) => [c.slug, c.id]));

  let created = 0;
  let updated = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const rowNumber = i + 2; // 1 for the header row, 1 for 1-indexing
    const cells = dataRows[i];
    const record: Record<string, string> = {};
    header.forEach((h, idx) => {
      record[h] = cells[idx] ?? "";
    });

    const categoryId = categoryIdBySlug.get((record.category ?? "").trim().toLowerCase());
    if (!categoryId) {
      errors.push({ row: rowNumber, message: `Unknown category "${record.category}".` });
      continue;
    }

    const parsed = rowSchema.safeParse({
      name: record.name,
      slug: record.slug || undefined,
      description: record.description ?? "",
      sku: record.sku || undefined,
      barcode: record.barcode || undefined,
      priceRupees: record.price,
      compareAtRupees: record.compare_at || undefined,
      readyToShip: truthy(record.ready_to_ship ?? ""),
      active: record.active ? truthy(record.active) : true,
      sizes: parseSizes(record.sizes ?? ""),
    });
    if (!parsed.success) {
      errors.push({ row: rowNumber, message: z.prettifyError(parsed.error) });
      continue;
    }
    const p = parsed.data;
    const slug = p.slug || slugify(p.name);

    const productPayload = {
      name: p.name,
      slug,
      description: p.description,
      category_id: categoryId,
      sku: p.sku || null,
      barcode: p.barcode || null,
      price_paise: Math.round(p.priceRupees * 100),
      compare_at_paise: p.compareAtRupees ? Math.round(p.compareAtRupees * 100) : null,
      ready_to_ship: p.readyToShip,
      active: p.active,
    };

    const { data: existing } = await admin
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    let productId: string;
    if (existing) {
      const { error } = await admin
        .from("products")
        .update(productPayload)
        .eq("id", existing.id);
      if (error) {
        errors.push({ row: rowNumber, message: error.message });
        continue;
      }
      productId = existing.id;
      updated++;
    } else {
      const { data: inserted, error } = await admin
        .from("products")
        .insert(productPayload)
        .select("id")
        .single();
      if (error) {
        errors.push({ row: rowNumber, message: error.message });
        continue;
      }
      productId = inserted.id;
      created++;
    }

    const keepSizes = p.sizes.map((s) => s.size);
    const { error: upsertError } = await admin.from("product_variants").upsert(
      p.sizes.map((s, idx) => ({
        product_id: productId,
        size: s.size,
        stock: s.stock,
        position: idx,
      })),
      { onConflict: "product_id,size" },
    );
    if (upsertError) {
      errors.push({ row: rowNumber, message: upsertError.message });
      continue;
    }

    // Drop sizes this row no longer lists. Diffed in JS and deleted by a
    // parameterised .in() filter rather than a hand-built "not in (...)"
    // string — the same fragility flagged in the single-product edit form.
    const { data: currentVariants } = await admin
      .from("product_variants")
      .select("size")
      .eq("product_id", productId);
    const staleSizes = (currentVariants ?? [])
      .map((v) => v.size)
      .filter((size) => !keepSizes.includes(size));
    if (staleSizes.length > 0) {
      await admin
        .from("product_variants")
        .delete()
        .eq("product_id", productId)
        .in("size", staleSizes);
    }
  }

  revalidatePath("/", "layout");
  return { created, updated, errors };
}
