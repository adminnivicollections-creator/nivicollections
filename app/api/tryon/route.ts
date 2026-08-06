import { NextResponse, type NextRequest } from "next/server";
import { getUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTryOn } from "@/lib/tryon";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
// Each call costs real money and takes real time — a low cap by design, not
// an oversight. Raise it once real usage tells you it's worth the cost.
const DAILY_LIMIT = 5;

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to try this on." }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const productId = formData.get("productId");
  const photo = formData.get("photo");
  if (typeof productId !== "string" || !(photo instanceof File)) {
    return NextResponse.json(
      { error: "Missing product or photo." },
      { status: 400 },
    );
  }
  if (!ALLOWED_TYPES.includes(photo.type)) {
    return NextResponse.json(
      { error: "Please upload a JPEG, PNG or WebP photo." },
      { status: 400 },
    );
  }
  if (photo.size > MAX_PHOTO_BYTES) {
    return NextResponse.json(
      { error: "That photo is over 8MB. Please use a smaller one." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  const { error: limitError } = await admin.rpc("increment_tryon_usage", {
    p_user_id: userId,
    p_max: DAILY_LIMIT,
  });
  if (limitError) {
    return NextResponse.json(
      {
        error: `You've reached today's limit of ${DAILY_LIMIT} try-ons. Please try again tomorrow.`,
      },
      { status: 429 },
    );
  }

  const { data: image, error: imageError } = await admin
    .from("product_images")
    .select("storage_path")
    .eq("product_id", productId)
    .order("position")
    .limit(1)
    .maybeSingle();
  if (imageError || !image) {
    return NextResponse.json(
      { error: "This product has no photo to try on yet." },
      { status: 404 },
    );
  }

  const garmentUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${image.storage_path}`;
  const garmentRes = await fetch(garmentUrl);
  if (!garmentRes.ok) {
    return NextResponse.json(
      { error: "Could not load the product photo." },
      { status: 500 },
    );
  }
  const garmentBuffer = Buffer.from(await garmentRes.arrayBuffer());
  const garmentType = garmentRes.headers.get("content-type") ?? "image/jpeg";
  const personBuffer = Buffer.from(await photo.arrayBuffer());

  try {
    // The uploaded photo and the generated result exist only for the
    // duration of this request — neither is written to storage or the
    // database at any point.
    const resultBuffer = await generateTryOn(
      personBuffer,
      photo.type,
      garmentBuffer,
      garmentType,
    );
    return NextResponse.json({
      image: `data:image/png;base64,${resultBuffer.toString("base64")}`,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not generate a preview." },
      { status: 502 },
    );
  }
}
