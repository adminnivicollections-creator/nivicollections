import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductForm } from "../../ProductForm";
import { updateProduct, deleteProduct } from "../../actions";
import { ImageManager } from "./ImageManager";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: product }, { data: categories }, { data: images }, { data: variants }] =
    await Promise.all([
      supabase.from("products").select("*").eq("id", id).maybeSingle(),
      supabase.from("categories").select("*").order("position"),
      supabase
        .from("product_images")
        .select("*")
        .eq("product_id", id)
        .order("position"),
      supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", id)
        .order("position"),
    ]);

  if (!product) notFound();

  const update = updateProduct.bind(null, product.id);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 pt-8">
        <h2 className="font-serif text-2xl font-light text-ink">
          {product.name}
        </h2>
        <Link
          href={`/products/${product.slug}`}
          className="text-[11px] uppercase tracking-[0.2em] text-gold"
        >
          View on shop
        </Link>
      </div>

      <ImageManager productId={product.id} images={images ?? []} />

      <ProductForm
        action={update}
        categories={categories ?? []}
        product={product}
        variants={variants ?? []}
        submitLabel="Save changes"
      />

      <form
        action={async () => {
          "use server";
          await deleteProduct(product.id);
        }}
        className="border-t border-ink/10 pt-8"
      >
        <button
          type="submit"
          className="text-xs uppercase tracking-[0.15em] text-red-700"
        >
          Hide from shop
        </button>
        <p className="mt-2 text-xs text-ink/40">
          Keeps the product for past orders, but removes it from the storefront.
        </p>
      </form>
    </>
  );
}
