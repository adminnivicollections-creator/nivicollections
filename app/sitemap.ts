import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/catalog";
import { imageUrl } from "@/lib/config";
import { POLICY_META } from "@/lib/policies";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);

  const now = new Date().toISOString();

  return [
    { url: siteUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${siteUrl}/search`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.5,
    },
    { url: `${siteUrl}/contact`, changeFrequency: "yearly", priority: 0.3 },
    ...POLICY_META.map((p) => ({
      url: `${siteUrl}/policies/${p.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
    ...categories.map((c) => ({
      url: `${siteUrl}/collections/${c.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${siteUrl}/products/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.6,
      ...(p.product_images.length > 0 && {
        images: p.product_images.map((img) => imageUrl(img.storage_path)),
      }),
    })),
  ];
}
