import { NextResponse, type NextRequest } from "next/server";
import { searchProducts } from "@/lib/catalog";
import { formatINR, imageUrl } from "@/lib/config";

// Backs the header's live-typing dropdown, so it stays small and fast; the
// full /search page re-runs the same query with no limit for the complete list.
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const products = await searchProducts(q, 6);

  return NextResponse.json({
    results: products.map((p) => ({
      slug: p.slug,
      name: p.name,
      price: formatINR(p.price_paise),
      image: p.product_images[0] ? imageUrl(p.product_images[0].storage_path) : null,
    })),
  });
}
