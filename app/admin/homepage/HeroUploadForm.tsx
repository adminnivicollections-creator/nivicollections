"use client";

import { useActionState } from "react";
import { uploadHomepageHero } from "./actions";

export function HeroUploadForm() {
  const [state, formAction, pending] = useActionState(uploadHomepageHero, undefined);

  return (
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
        {pending ? "Uploading…" : "Upload new photo"}
      </button>
      {state?.error && <p className="w-full text-sm text-red-700">{state.error}</p>}
    </form>
  );
}
