import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Product } from "@/lib/supabase/types";
import { ProductsTable } from "./ProductsTable";

export const dynamic = "force-dynamic";

// The hand-written Database type carries no Relationships, so embedded selects
// need their shape stated. Regenerating types from the live DB removes this.
type Row = Product & {
  product_variants: { stock: number }[];
  categories: { name: string } | null;
  product_images: { storage_path: string; position: number }[];
};

export default async function AdminProductsPage() {
  const supabase = createAdminClient();
  const [{ data: products, error }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "*, product_variants(stock), categories(name), product_images(storage_path, position)",
      )
      .order("created_at", { ascending: false })
      .overrideTypes<Row[]>(),
    supabase.from("categories").select("*").order("position"),
  ]);

  if (error) throw error;

  return (
    <div className="py-10">
      {products.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-ink/60">No products yet.</p>
          <Link
            href="/admin/products/new"
            className="mt-6 inline-block bg-ink px-8 py-3 text-[11px] uppercase tracking-[0.25em] text-cream"
          >
            Add your first saree
          </Link>
        </div>
      ) : (
        <ProductsTable products={products} categories={categories ?? []} />
      )}
    </div>
  );
}
