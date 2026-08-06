import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createRazorpayOrder } from "@/lib/razorpay";
import { shippingFor } from "@/lib/config";
import { validateCoupon } from "@/lib/coupons";

// The browser sends variant ids and quantities only. Names, prices, stock and
// totals are all read from the database here — a tampered cart cannot change
// what the customer is charged.
const schema = z.object({
  email: z.email(),
  phone: z.string().trim().regex(/^[0-9+\-\s]{8,15}$/, "Enter a valid phone number"),
  address: z.object({
    full_name: z.string().trim().min(2).max(120),
    phone: z.string().trim().regex(/^[0-9+\-\s]{8,15}$/),
    line1: z.string().trim().min(3).max(200),
    line2: z.string().trim().max(200).default(""),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100),
    pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode"),
    country: z.literal("India").default("India"),
  }),
  items: z
    .array(
      z.object({
        variantId: z.uuid(),
        qty: z.coerce.number().int().min(1).max(10),
      }),
    )
    .min(1)
    .max(20),
  couponCode: z.string().trim().max(40).optional(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: z.prettifyError(parsed.error) },
      { status: 400 },
    );
  }
  const { email, phone, address, items, couponCode } = parsed.data;

  // Collapse duplicate variant ids so a repeated line cannot dodge the stock check.
  const wanted = new Map<string, number>();
  for (const i of items) {
    wanted.set(i.variantId, (wanted.get(i.variantId) ?? 0) + i.qty);
  }

  const admin = createAdminClient();
  const { data: variants, error: variantError } = await admin
    .from("product_variants")
    .select("id, size, stock, product_id, products(id, name, slug, price_paise, active)")
    .in("id", [...wanted.keys()])
    .overrideTypes<
      {
        id: string;
        size: string;
        stock: number;
        product_id: string;
        products: {
          id: string;
          name: string;
          slug: string;
          price_paise: number;
          active: boolean;
        } | null;
      }[]
    >();

  if (variantError) {
    return NextResponse.json({ error: "Could not load cart." }, { status: 500 });
  }
  if (!variants || variants.length !== wanted.size) {
    return NextResponse.json(
      { error: "An item in your cart is no longer available." },
      { status: 409 },
    );
  }

  const lines = [];
  for (const v of variants) {
    const qty = wanted.get(v.id)!;
    if (!v.products?.active) {
      return NextResponse.json(
        { error: `${v.products?.name ?? "An item"} is no longer available.` },
        { status: 409 },
      );
    }
    if (v.stock < qty) {
      return NextResponse.json(
        {
          error:
            v.stock === 0
              ? `${v.products.name} (${v.size}) has just sold out.`
              : `Only ${v.stock} left of ${v.products.name} (${v.size}).`,
        },
        { status: 409 },
      );
    }
    lines.push({
      variant_id: v.id,
      product_id: v.products.id,
      product_name: v.products.name,
      product_slug: v.products.slug,
      size: v.size,
      unit_price_paise: v.products.price_paise,
      qty,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.unit_price_paise * l.qty, 0);

  let discount = 0;
  let appliedCode = "";
  if (couponCode) {
    const result = await validateCoupon(couponCode, subtotal);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    discount = result.discountPaise;
    appliedCode = result.coupon.code;
  }

  const shipping = shippingFor(subtotal);
  const total = subtotal - discount + shipping;

  // Attach the order to the signed-in user when there is one; guests get null.
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = (claims?.claims?.sub as string | undefined) ?? null;

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: userId,
      email,
      phone,
      shipping_address: address,
      subtotal_paise: subtotal,
      shipping_paise: shipping,
      coupon_code: appliedCode,
      discount_paise: discount,
      total_paise: total,
      status: "pending_payment",
    })
    .select("id, order_number")
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: "Could not create your order." },
      { status: 500 },
    );
  }

  const { error: itemsError } = await admin
    .from("order_items")
    .insert(lines.map((l) => ({ ...l, order_id: order.id })));
  if (itemsError) {
    return NextResponse.json(
      { error: "Could not save your order items." },
      { status: 500 },
    );
  }

  let razorpayOrder;
  try {
    razorpayOrder = await createRazorpayOrder({
      amountPaise: total,
      receipt: order.order_number,
      notes: { order_id: order.id },
    });
  } catch (e) {
    // Leave the order as pending_payment; it simply never gets paid.
    console.error("Razorpay order creation failed", e);
    return NextResponse.json(
      { error: "Payment could not be started. Please try again." },
      { status: 502 },
    );
  }

  await admin
    .from("orders")
    .update({ razorpay_order_id: razorpayOrder.id })
    .eq("id", order.id);

  return NextResponse.json({
    orderNumber: order.order_number,
    razorpayOrderId: razorpayOrder.id,
    amountPaise: total,
    discountPaise: discount,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  });
}
