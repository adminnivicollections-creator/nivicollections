import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { POLICIES, getPolicy } from "@/lib/policies";
import { BRAND, BUSINESS } from "@/lib/config";

export function generateStaticParams() {
  return POLICIES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/policies/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) return { title: "Not found" };
  return { title: policy.title, description: policy.summary };
}

export default async function PolicyPage({
  params,
}: PageProps<"/policies/[slug]">) {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) notFound();

  return (
    <article className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-serif text-4xl font-light text-ink">
        {policy.title}
      </h1>
      <p className="mt-3 text-ink/60">{policy.summary}</p>

      <div className="mt-12 space-y-10">
        {policy.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-gold">
              {section.heading}
            </h2>
            <div className="mt-4 space-y-3">
              {section.body.map((p) => (
                <p key={p} className="leading-relaxed text-ink/80">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className="mt-16 border-t border-ink/10 pt-8 text-sm leading-relaxed text-ink/60">
        <p className="text-ink">{BUSINESS.legalEntity}</p>
        <p className="mt-1 whitespace-pre-line">{BUSINESS.address}</p>
        <p className="mt-1">{BUSINESS.phone}</p>
        <p className="mt-1">{BRAND.email}</p>
        {BUSINESS.gstin && <p className="mt-1">GSTIN: {BUSINESS.gstin}</p>}
      </footer>
    </article>
  );
}
