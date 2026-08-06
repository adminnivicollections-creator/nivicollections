"use client";

import Image from "next/image";
import { useActionState } from "react";
import { imageUrl } from "@/lib/config";
import type { ProductImage } from "@/lib/supabase/types";
import { uploadProductImage, deleteProductImage } from "../../actions";

export function ImageManager({
  productId,
  images,
}: {
  productId: string;
  images: ProductImage[];
}) {
  const upload = uploadProductImage.bind(null, productId);
  const [state, formAction, pending] = useActionState(upload, undefined);

  return (
    <section className="border-b border-ink/10 py-8">
      <h3 className="text-[11px] uppercase tracking-[0.2em] text-ink/60">
        Photos
      </h3>

      {images.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-4">
          {images.map((img, i) => (
            <li key={img.id} className="relative">
              <div className="relative h-40 w-32 overflow-hidden bg-blush">
                <Image
                  src={imageUrl(img.storage_path)}
                  alt={img.alt || "Product photo"}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </div>
              {i === 0 && (
                <span className="absolute left-1 top-1 bg-ink px-2 py-0.5 text-[9px] uppercase tracking-wider text-cream">
                  Main
                </span>
              )}
              <form
                action={async () => {
                  await deleteProductImage(img.id);
                }}
              >
                <button
                  type="submit"
                  className="mt-2 text-xs uppercase tracking-[0.15em] text-ink/50 hover:text-red-700"
                >
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="mt-5 flex flex-wrap items-center gap-4">
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="text-sm file:mr-3 file:border file:border-ink/20 file:bg-transparent file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-[0.15em]"
        />
        <button
          type="submit"
          disabled={pending}
          className="border border-ink px-6 py-2 text-[11px] uppercase tracking-[0.2em] disabled:opacity-40"
        >
          {pending ? "Uploading…" : "Upload"}
        </button>
      </form>

      <p className="mt-2 text-xs text-ink/40">
        JPEG, PNG or WebP, up to 5MB. The first photo is used on the shop grid.
      </p>
      {state?.error && (
        <p className="mt-2 text-sm text-red-700">{state.error}</p>
      )}
    </section>
  );
}
