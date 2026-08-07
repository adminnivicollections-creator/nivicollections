import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { BulkUploadForm } from "./BulkUploadForm";

export const dynamic = "force-dynamic";

const TEMPLATE_HEADER =
  "name,slug,category,description,sku,barcode,price,compare_at,ready_to_ship,active,sizes";

export default async function BulkUploadPage() {
  const { data: categories } = await createAdminClient()
    .from("categories")
    .select("slug, name")
    .order("position");

  const exampleCategory = categories?.[0]?.slug ?? "sarees";
  const templateRow = `Kanjivaram Silk Saree,,${exampleCategory},Handwoven pure silk saree with gold zari border,SKU-001,,4999,5999,yes,yes,Free Size:5;M:3`;
  const templateCsv = `${TEMPLATE_HEADER}\n${templateRow}\n`;
  const templateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(templateCsv)}`;

  return (
    <div className="py-10">
      <Link
        href="/admin/products"
        className="text-[11px] uppercase tracking-[0.2em] text-ink/50 hover:text-ink"
      >
        ← All products
      </Link>

      <h2 className="mt-4 font-serif text-2xl font-light text-ink">
        Bulk upload
      </h2>
      <p className="mt-2 max-w-xl text-sm text-ink/60">
        A row with a slug matching an existing product updates it; anything
        else creates a new one. Up to 500 rows per upload.
      </p>

      <div className="mt-6 max-w-xl border border-ink/10 p-4 text-sm text-ink/70">
        <p className="font-medium text-ink">Columns</p>
        <dl className="mt-2 space-y-1">
          <div><dt className="inline font-mono text-xs">name</dt> — required</div>
          <div><dt className="inline font-mono text-xs">slug</dt> — optional, generated from name if blank</div>
          <div>
            <dt className="inline font-mono text-xs">category</dt> — required, must match a category slug (
            {categories?.map((c) => c.slug).join(", ") || "none set up yet"})
          </div>
          <div><dt className="inline font-mono text-xs">description, sku, barcode</dt> — optional</div>
          <div><dt className="inline font-mono text-xs">price, compare_at</dt> — in rupees</div>
          <div><dt className="inline font-mono text-xs">ready_to_ship, active</dt> — yes/no</div>
          <div>
            <dt className="inline font-mono text-xs">sizes</dt> — required,{" "}
            <span className="font-mono text-xs">size:stock</span> pairs separated by{" "}
            <span className="font-mono text-xs">;</span>, e.g.{" "}
            <span className="font-mono text-xs">Free Size:5;M:3;L:0</span>
          </div>
        </dl>
        <a
          href={templateHref}
          download="products-template.csv"
          className="mt-4 inline-block text-[11px] uppercase tracking-[0.15em] text-gold"
        >
          Download a template
        </a>
      </div>

      <BulkUploadForm />
    </div>
  );
}
