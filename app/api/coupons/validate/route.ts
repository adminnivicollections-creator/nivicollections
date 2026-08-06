import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { validateCoupon } from "@/lib/coupons";

// Preview only, for showing the discount before payment. The real checkout
// route re-validates from scratch and is the only place a discount is ever
// actually applied to a charge.
const schema = z.object({
  code: z.string().trim().min(1).max(40),
  subtotalPaise: z.coerce.number().int().min(0),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const result = await validateCoupon(parsed.data.code, parsed.data.subtotalPaise);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    discountPaise: result.discountPaise,
    code: result.coupon.code,
  });
}
