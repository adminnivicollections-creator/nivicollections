import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/catalog";
import { POLICY_META } from "@/lib/policies";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);

  return [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/contact`, changeFrequency: "yearly", priority: 0.3 },
    ...POLICY_META.map((p) => ({
      url: `${siteUrl}/policies/${p.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
    ...categories.map((c) => ({
      url: `${siteUrl}/collections/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${siteUrl}/products/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
