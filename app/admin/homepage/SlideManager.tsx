"use client";

import { useActionState } from "react";
import Image from "next/image";
import { imageUrl } from "@/lib/config";
import type { HomepageSlide } from "@/lib/supabase/types";
import { uploadHomepageSlide, deleteHomepageSlide, moveHomepageSlide } from "./actions";

export function SlideManager({ slides }: { slides: HomepageSlide[] }) {
  const [state, formAction, pending] = useActionState(uploadHomepageSlide, undefined);

  return (
    <div className="mt-6">
      {slides.length > 0 ? (
        <ul className="space-y-4">
          {slides.map((s, i) => {
            const moveUp = moveHomepageSlide.bind(null, s.id, "up");
            const moveDown = moveHomepageSlide.bind(null, s.id, "down");
            const remove = deleteHomepageSlide.bind(null, s.id);

            return (
              <li key={s.id} className="flex items-center gap-4 border border-ink/10 p-3">
                <div className="relative h-16 w-28 shrink-0 overflow-hidden bg-blush">
                  <Image
                    src={imageUrl(s.image_path)}
                    alt=""
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1 text-sm text-ink/70">
                  {s.link_href ? (
                    <span className="font-mono text-xs">{s.link_href}</span>
                  ) : (
                    <span className="text-ink/40">No link</span>
                  )}
                </div>
                <div className="flex shrink-0 gap-3 text-xs uppercase tracking-[0.15em]">
                  <form action={moveUp}>
                    <button type="submit" disabled={i === 0} className="text-ink/60 hover:text-ink disabled:opacity-20">
                      Up
                    </button>
                  </form>
                  <form action={moveDown}>
                    <button
                      type="submit"
                      disabled={i === slides.length - 1}
                      className="text-ink/60 hover:text-ink disabled:opacity-20"
                    >
                      Down
                    </button>
                  </form>
                  <form action={remove}>
                    <button type="submit" className="text-red-700 hover:text-red-800">
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-ink/50">
          No slides yet — showing the default bundled banner.
        </p>
      )}

      <form action={formAction} className="mt-6 flex flex-wrap items-end gap-4 border-t border-ink/10 pt-6">
        <div>
          <label htmlFor="file" className="block text-[11px] uppercase tracking-[0.2em] text-ink/60">
            New slide photo
          </label>
          <input
            id="file"
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="mt-1 text-sm file:mr-3 file:border file:border-ink/20 file:bg-transparent file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-[0.15em]"
          />
        </div>
        <div>
          <label htmlFor="linkHref" className="block text-[11px] uppercase tracking-[0.2em] text-ink/60">
            Links to (optional)
          </label>
          <input
            id="linkHref"
            name="linkHref"
            placeholder="/collections/sarees"
            className="mt-1 border border-ink/20 bg-transparent px-4 py-2 text-sm outline-none focus:border-ink"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="border border-ink px-6 py-2 text-[11px] uppercase tracking-[0.2em] disabled:opacity-40"
        >
          {pending ? "Uploading…" : "Add slide"}
        </button>
      </form>
      {state?.error && <p className="mt-2 text-sm text-red-700">{state.error}</p>}
    </div>
  );
}
