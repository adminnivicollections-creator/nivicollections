import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { POLICY_META, getPolicy } from "@/lib/policies";
import { getStoreSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return POLICY_META.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/policies/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const meta = POLICY_META.find((p) => p.slug === slug);
  return meta ? { title: meta.title } : { title: "Not found" };
}

export default async function PolicyPage({
  params,
}: PageProps<"/policies/[slug]">) {
  const { slug } = await params;
  const settings = await getStoreSettings();
  const policy = getPolicy(slug, settings);
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
        <p className="text-ink">{settings.legal_name}</p>
        <p className="mt-1 whitespace-pre-line">{settings.address}</p>
        <p className="mt-1">{settings.support_phone}</p>
        <p className="mt-1">{settings.support_email}</p>
        {settings.gstin && <p className="mt-1">GSTIN: {settings.gstin}</p>}
      </footer>
    </article>
  );
}
