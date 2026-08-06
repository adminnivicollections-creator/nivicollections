import { createAdminClient } from "@/lib/supabase/admin";
import { ProductForm } from "../../ProductForm";
import { createProduct } from "../../actions";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const { data: categories, error } = await createAdminClient()
    .from("categories")
    .select("*")
    .order("position");

  if (error) throw error;

  return (
    <>
      <h2 className="pt-8 font-serif text-2xl font-light text-ink">
        Add product
      </h2>
      <p className="mt-2 text-sm text-ink/50">
        Photos are added after saving.
      </p>
      <ProductForm
        action={createProduct}
        categories={categories}
        submitLabel="Create product"
      />
    </>
  );
}
