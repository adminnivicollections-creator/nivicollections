"use client";

import { useActionState } from "react";
import type { StoreSettings } from "@/lib/supabase/types";
import { updateStoreSettings } from "./actions";

const field =
  "mt-1 w-full border border-ink/20 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-ink";
const label = "text-[11px] uppercase tracking-[0.2em] text-ink/60";

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const [state, formAction, pending] = useActionState(
    updateStoreSettings,
    undefined,
  );

  return (
    <form action={formAction} className="mt-8 max-w-xl space-y-6">
      <div>
        <label htmlFor="announcementText" className={label}>
          Announcement bar
        </label>
        <input
          id="announcementText"
          name="announcementText"
          defaultValue={settings.announcement_text}
          placeholder="Leave empty to hide the bar"
          className={field}
        />
        <p className="mt-1 text-xs text-ink/40">
          Shown at the top of every page. Leave empty to hide it.
        </p>
      </div>

      <div>
        <label htmlFor="legalName" className={label}>
          Registered business name
        </label>
        <input
          id="legalName"
          name="legalName"
          required
          defaultValue={settings.legal_name}
          className={field}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="supportEmail" className={label}>
            Support email
          </label>
          <input
            id="supportEmail"
            name="supportEmail"
            type="email"
            required
            defaultValue={settings.support_email}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="supportPhone" className={label}>
            Support phone
          </label>
          <input
            id="supportPhone"
            name="supportPhone"
            required
            defaultValue={settings.support_phone}
            className={field}
          />
        </div>
      </div>

      <div>
        <label htmlFor="address" className={label}>
          Registered address
        </label>
        <textarea
          id="address"
          name="address"
          rows={2}
          required
          defaultValue={settings.address}
          className={field}
        />
      </div>

      <div>
        <label htmlFor="gstin" className={label}>
          GSTIN (optional)
        </label>
        <input
          id="gstin"
          name="gstin"
          defaultValue={settings.gstin ?? ""}
          placeholder="Leave blank if not yet registered"
          className={`${field} font-mono uppercase`}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="returnWindowDays" className={label}>
            Return window (days)
          </label>
          <input
            id="returnWindowDays"
            name="returnWindowDays"
            type="number"
            min="1"
            required
            defaultValue={settings.return_window_days}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="freeShippingAboveRupees" className={label}>
            Free shipping above (₹)
          </label>
          <input
            id="freeShippingAboveRupees"
            name="freeShippingAboveRupees"
            type="number"
            min="0"
            required
            defaultValue={settings.free_shipping_above_paise / 100}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="flatShippingRupees" className={label}>
            Shipping fee below that (₹)
          </label>
          <input
            id="flatShippingRupees"
            name="flatShippingRupees"
            type="number"
            min="0"
            required
            defaultValue={settings.flat_shipping_paise / 100}
            className={field}
          />
        </div>
      </div>

      {state && "error" in state && (
        <p className="whitespace-pre-line text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state && "ok" in state && (
        <p className="text-sm text-gold">Saved.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-ink px-8 py-3 text-[11px] uppercase tracking-[0.2em] text-cream disabled:opacity-40"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
