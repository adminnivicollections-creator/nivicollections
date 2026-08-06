import "server-only";

export type ImageInput = { buffer: Buffer; type: string };

/**
 * Composites a customer's photo with garment reference photos using OpenAI's
 * image editing model. Not a dedicated virtual-try-on model — it re-renders
 * the whole image, so the result approximates the person rather than locking
 * their exact likeness. Verified against the real API before this was
 * written, including a real side-by-side test of one reference photo versus
 * three (full shot + a border/pallu close-up): the extra close-up visibly
 * sharpened the embroidery and border detail in the result, which is why
 * the caller sends every photo a product has, not just the first.
 */
export async function generateTryOn(
  person: ImageInput,
  garments: ImageInput[],
): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Try-on is not configured.");
  if (garments.length === 0) throw new Error("No reference photos to try on.");

  const form = new FormData();
  form.append("model", "gpt-image-1");
  form.append(
    "image[]",
    new Blob([new Uint8Array(person.buffer)], { type: person.type }),
    "person.jpg",
  );
  garments.forEach((g, i) => {
    form.append(
      "image[]",
      new Blob([new Uint8Array(g.buffer)], { type: g.type }),
      `garment-${i}.jpg`,
    );
  });
  form.append(
    "prompt",
    "Dress the uploaded person (first photo) in the saree shown in the " +
      "reference photos that follow. Preserve the person's face, hairstyle, " +
      "skin tone, body shape and pose, and keep the original background. " +
      "Recreate the saree exactly as shown across the reference photos — " +
      "including its border, pallu, pleats, embroidery, prints, fabric " +
      "texture and colours — rather than a generic approximation. Produce " +
      "a realistic ecommerce fashion try-on photograph.",
  );
  form.append("size", "1024x1024");

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("OpenAI try-on failed", res.status, text);
    throw new Error(
      res.status === 400
        ? "We couldn't generate a preview from that photo. Try a clear, front-facing photo in good light."
        : "The try-on service is temporarily unavailable. Please try again shortly.",
    );
  }

  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("The try-on service did not return an image.");
  return Buffer.from(b64, "base64");
}
