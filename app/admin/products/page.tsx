import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR, imageUrl } from "@/lib/config";
import type { Product } from "@/lib/supabase/types";

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
  const { data: products, error } = await supabase
    .from("products")
    .select(
      "*, product_variants(stock), categories(name), product_images(storage_path, position)",
    )
    .order("created_at", { ascending: false })
    .overrideTypes<Row[]>();

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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 text-[11px] uppercase tracking-[0.15em] text-ink/50">
              <tr>
                <th className="py-3 pr-4 font-normal" />
                <th className="py-3 pr-4 font-normal">Product</th>
                <th className="py-3 pr-4 font-normal">Category</th>
                <th className="py-3 pr-4 font-normal">Price</th>
                <th className="py-3 pr-4 font-normal">Stock</th>
                <th className="py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {products.map((p) => {
                const stock = p.product_variants.reduce(
                  (n, v) => n + v.stock,
                  0,
                );
                const thumb = [...p.product_images].sort(
                  (a, b) => a.position - b.position,
                )[0];

                return (
                  <tr key={p.id}>
                    <td className="w-16 py-4 pr-4">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="relative block h-14 w-14 overflow-hidden bg-blush"
                      >
                        {thumb && (
                          <Image
                            src={imageUrl(thumb.storage_path)}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        )}
                      </Link>
                    </td>
                    <td className="py-4 pr-4">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="font-serif text-base text-ink hover:text-gold"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="py-4 pr-4 text-ink/60">
                      {p.categories?.name ?? "—"}
                    </td>
                    <td className="py-4 pr-4">{formatINR(p.price_paise)}</td>
                    <td
                      className={`py-4 pr-4 ${stock === 0 ? "text-red-700" : "text-ink"}`}
                    >
                      {stock}
                    </td>
                    <td className="py-4 text-ink/60">
                      {p.active ? "Live" : "Hidden"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
