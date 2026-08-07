import { NextResponse, type NextRequest } from "next/server";
import { searchProducts } from "@/lib/catalog";
import { formatINR, imageUrl } from "@/lib/config";
import { checkRateLimit } from "@/lib/rateLimit";

// Backs the header's live-typing dropdown, so it stays small and fast; the
// full /search page re-runs the same query with no limit for the complete list.
export async function GET(request: NextRequest) {
  // Higher ceiling than checkout — this fires on every keystroke, not just
  // on a deliberate submit.
  if (!(await checkRateLimit(request, "search", 60, 30))) {
    return NextResponse.json({ results: [] }, { status: 429 });
  }

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
