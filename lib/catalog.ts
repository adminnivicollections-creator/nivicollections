import { createClient } from "./supabase/server";
import type { Category, Product, ProductImage, ProductVariant } from "./supabase/types";

export type ProductWithMedia = Product & {
  product_images: ProductImage[];
  product_variants: ProductVariant[];
  categories: Pick<Category, "slug" | "name"> | null;
};

const PRODUCT_SELECT =
  "*, product_images(*), product_variants(*), categories(slug, name)";

function sortMedia(p: ProductWithMedia): ProductWithMedia {
  return {
    ...p,
    product_images: [...p.product_images].sort((a, b) => a.position - b.position),
    product_variants: [...p.product_variants].sort(
      (a, b) => a.position - b.position,
    ),
  };
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("active", true)
    .order("position");

  if (error) throw error;
  return data ?? [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getProducts(opts?: {
  categorySlug?: string;
  limit?: number;
}): Promise<ProductWithMedia[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (opts?.categorySlug) {
    query = query.eq("categories.slug", opts.categorySlug);
  }
  if (opts?.limit) {
    query = query.limit(opts.limit);
  }

  const { data, error } = await query.overrideTypes<ProductWithMedia[]>();
  if (error) throw error;

  // An inner-join filter on the embedded table still returns the parent row
  // with a null category, so drop those rather than render a stray product.
  return (data ?? [])
    .filter((p) => !opts?.categorySlug || p.categories !== null)
    .map(sortMedia);
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductWithMedia | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle()
    .overrideTypes<ProductWithMedia>();

  if (error) throw error;
  return data ? sortMedia(data) : null;
}

export async function getRelatedProducts(
  product: ProductWithMedia,
  limit = 4,
): Promise<ProductWithMedia[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .eq("category_id", product.category_id)
    .neq("id", product.id)
    .limit(limit)
    .overrideTypes<ProductWithMedia[]>();

  if (error) throw error;
  return (data ?? []).map(sortMedia);
}

export function isSoldOut(p: ProductWithMedia): boolean {
  return p.product_variants.every((v) => v.stock <= 0);
}
