import "server-only";

/**
 * Composites a customer's photo with a garment photo using OpenAI's image
 * editing model. Not a dedicated virtual-try-on model — it re-renders the
 * whole image, so the result approximates the person rather than locking
 * their exact likeness. Verified against the real API before this was
 * written; the drape, colour and border came through convincingly in
 * testing, the face did not come through pixel-identical.
 */
export async function generateTryOn(
  personBuffer: Buffer,
  personType: string,
  garmentBuffer: Buffer,
  garmentType: string,
): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Try-on is not configured.");

  const form = new FormData();
  form.append("model", "gpt-image-1");
  form.append(
    "image[]",
    new Blob([new Uint8Array(personBuffer)], { type: personType }),
    "person.jpg",
  );
  form.append(
    "image[]",
    new Blob([new Uint8Array(garmentBuffer)], { type: garmentType }),
    "garment.jpg",
  );
  form.append(
    "prompt",
    "Take the person from the first photo and dress them in the saree shown " +
      "in the second photo. Keep the person's face, body, pose, skin tone " +
      "and the background from the first photo unchanged as closely as " +
      "possible. Realistically render the saree's drape, colour, pattern " +
      "and border on their body, as if they are actually wearing it.",
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
