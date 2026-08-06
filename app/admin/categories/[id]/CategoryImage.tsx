"use client";

import Image from "next/image";
import { useActionState } from "react";
import { imageUrl } from "@/lib/config";
import { uploadCategoryImage } from "../actions";

export function CategoryImage({
  categoryId,
  imagePath,
}: {
  categoryId: string;
  imagePath: string | null;
}) {
  const upload = uploadCategoryImage.bind(null, categoryId);
  const [state, formAction, pending] = useActionState(upload, undefined);

  return (
    <section className="mt-8 border-b border-ink/10 pb-8">
      <h3 className="text-[11px] uppercase tracking-[0.2em] text-ink/60">
        Photo
      </h3>
      <p className="mt-1 text-xs text-ink/40">
        Shown as the tile on the homepage collections grid.
      </p>

      {imagePath && (
        <div className="relative mt-4 h-40 w-32 overflow-hidden bg-blush">
          <Image
            src={imageUrl(imagePath)}
            alt=""
            fill
            sizes="128px"
            className="object-cover"
          />
        </div>
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
          {pending ? "Uploading…" : imagePath ? "Replace" : "Upload"}
        </button>
      </form>
      {state?.error && (
        <p className="mt-2 text-sm text-red-700">{state.error}</p>
      )}
    </section>
  );
}
