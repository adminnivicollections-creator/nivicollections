"use client";

import { useActionState, useState } from "react";
import type { Category } from "@/lib/supabase/types";
import type { ActionResult } from "./actions";

const field =
  "mt-1 w-full border border-ink/20 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-ink";
const label = "text-[11px] uppercase tracking-[0.2em] text-ink/60";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function CategoryForm({
  action,
  category,
  submitLabel,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  category?: Category;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(category));

  return (
    <form action={formAction} className="mt-6 max-w-xl space-y-5">
      <div>
        <label htmlFor="name" className={label}>
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugEdited) setSlug(slugify(e.target.value));
          }}
          className={field}
        />
      </div>

      <div>
        <label htmlFor="slug" className={label}>
          URL slug
        </label>
        <input
          id="slug"
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugEdited(true);
          }}
          className={field}
        />
        <p className="mt-1 text-xs text-ink/40">/collections/{slug || "…"}</p>
      </div>

      <div>
        <label htmlFor="position" className={label}>
          Position
        </label>
        <input
          id="position"
          name="position"
          type="number"
          min="0"
          defaultValue={category?.position ?? 0}
          className={field}
        />
        <p className="mt-1 text-xs text-ink/40">
          Lower numbers appear first in the nav and homepage grid.
        </p>
      </div>

      <label className="flex items-center gap-3 text-sm text-ink">
        <input
          type="checkbox"
          name="active"
          defaultChecked={category?.active ?? true}
        />
        Visible in the shop
      </label>

      {state?.error && (
        <p className="whitespace-pre-line text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-ink px-8 py-3 text-[11px] uppercase tracking-[0.2em] text-cream disabled:opacity-40"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
