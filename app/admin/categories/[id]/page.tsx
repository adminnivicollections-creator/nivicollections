import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { CategoryForm } from "../CategoryForm";
import { updateCategory, deleteCategory } from "../actions";
import { CategoryImage } from "./CategoryImage";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({
  params,
}: PageProps<"/admin/categories/[id]">) {
  const { id } = await params;

  const { data: category } = await createAdminClient()
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!category) notFound();

  const update = updateCategory.bind(null, category.id);

  return (
    <div className="py-10">
      <Link
        href="/admin/categories"
        className="text-[11px] uppercase tracking-[0.2em] text-ink/50 hover:text-ink"
      >
        ← All categories
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl font-light text-ink">
          {category.name}
        </h2>
        <Link
          href={`/collections/${category.slug}`}
          className="text-[11px] uppercase tracking-[0.2em] text-gold"
        >
          View on shop
        </Link>
      </div>

      <CategoryImage
        categoryId={category.id}
        imagePath={category.image_path}
      />

      <CategoryForm action={update} category={category} submitLabel="Save changes" />

      <form
        action={async () => {
          "use server";
          await deleteCategory(category.id);
        }}
        className="mt-10 border-t border-ink/10 pt-8"
      >
        <button
          type="submit"
          className="text-xs uppercase tracking-[0.15em] text-red-700"
        >
          Hide from shop
        </button>
        <p className="mt-2 text-xs text-ink/40">
          Products already in this category keep it — this only removes it
          from navigation and the homepage grid.
        </p>
      </form>
    </div>
  );
}
