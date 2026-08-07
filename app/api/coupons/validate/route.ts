import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateCoupon } from "@/lib/coupons";
import { checkRateLimit } from "@/lib/rateLimit";

// Preview only, for showing the discount before payment. The real checkout
// route re-validates from scratch and is the only place a discount is ever
// actually applied to a charge. Prices are re-looked-up here from variant
// ids, same as checkout — buy_x_get_y needs real per-line prices, and a
// client-supplied subtotal was never trustworthy for that anyway.
const schema = z.object({
  code: z.string().trim().min(1).max(40),
  items: z
    .array(z.object({ variantId: z.uuid(), qty: z.coerce.number().int().min(1).max(10) }))
    .min(1)
    .max(20),
});

export async function POST(request: NextRequest) {
  // Also guards against brute-forcing coupon codes by trying every string
  // in a wordlist, not just abuse volume.
  if (!(await checkRateLimit(request, "coupon-validate", 300, 20))) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429 },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: variants, error } = await admin
    .from("product_variants")
    .select("id, products(price_paise)")
    .in(
      "id",
      parsed.data.items.map((i) => i.variantId),
    )
    .overrideTypes<{ id: string; products: { price_paise: number } | null }[]>();
  if (error || !variants) {
    return NextResponse.json({ error: "Could not load cart." }, { status: 500 });
  }

  const priceByVariant = new Map(variants.map((v) => [v.id, v.products?.price_paise ?? 0]));
  const lines = parsed.data.items.map((i) => ({
    variantId: i.variantId,
    unitPricePaise: priceByVariant.get(i.variantId) ?? 0,
    qty: i.qty,
  }));

  const result = await validateCoupon(parsed.data.code, lines);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    discountPaise: result.discountPaise,
    freeShipping: result.freeShipping,
    code: result.coupon.code,
  });
}
