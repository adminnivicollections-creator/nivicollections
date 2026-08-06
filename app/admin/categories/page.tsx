import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { imageUrl } from "@/lib/config";
import { CategoryForm } from "./CategoryForm";
import { createCategory } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const { data: categories, error } = await createAdminClient()
    .from("categories")
    .select("*")
    .order("position");

  if (error) throw error;

  return (
    <div className="py-10">
      <h2 className="font-serif text-2xl font-light text-ink">
        Add a category
      </h2>
      <CategoryForm action={createCategory} submitLabel="Create category" />

      <h2 className="mt-16 font-serif text-2xl font-light text-ink">
        All categories
      </h2>
      {categories.length === 0 ? (
        <p className="mt-6 text-ink/60">No categories yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 text-[11px] uppercase tracking-[0.15em] text-ink/50">
              <tr>
                <th className="py-3 pr-4 font-normal" />
                <th className="py-3 pr-4 font-normal">Name</th>
                <th className="py-3 pr-4 font-normal">Slug</th>
                <th className="py-3 pr-4 font-normal">Position</th>
                <th className="py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {categories.map((c) => (
                <tr key={c.id}>
                  <td className="w-16 py-4 pr-4">
                    <Link
                      href={`/admin/categories/${c.id}`}
                      className="relative block h-14 w-14 overflow-hidden bg-blush"
                    >
                      {c.image_path && (
                        <Image
                          src={imageUrl(c.image_path)}
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
                      href={`/admin/categories/${c.id}`}
                      className="font-serif text-base text-ink hover:text-gold"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="py-4 pr-4 text-ink/60">/{c.slug}</td>
                  <td className="py-4 pr-4 text-ink/60">{c.position}</td>
                  <td className="py-4 text-ink/60">
                    {c.active ? "Live" : "Hidden"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
