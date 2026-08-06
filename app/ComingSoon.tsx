"use client";

import { useActionState } from "react";
import { BRAND } from "@/lib/config";
import { subscribe } from "./subscribe";

const FEATURES = [
  { label: "Premium\nQuality", icon: "❦" },
  { label: "Exquisite\nDesigns", icon: "◈" },
  { label: "Crafted\nwith Care", icon: "❋" },
  { label: "Elegance in\nEvery Drape", icon: "✦" },
];

export function ComingSoon() {
  const [state, formAction, pending] = useActionState(subscribe, undefined);

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#0b0906] px-6 py-20 text-center">
      {/* Soft gold pooling behind the mark, so the flat black has some depth. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 38%, rgba(197,158,90,0.20), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-6 border border-[#c59e5a]/25 sm:inset-10"
      />

      <div className="relative z-10 flex max-w-2xl flex-col items-center">
        <p className="font-serif text-6xl font-light leading-none text-[#d9b978] sm:text-7xl">
          <span className="tracking-[0.05em]">N</span>
          <span className="tracking-[0.05em]">C</span>
        </p>

        <h1 className="mt-8 font-serif text-4xl font-light tracking-[0.35em] text-[#e8cf9a] sm:text-5xl">
          NIVI
        </h1>
        <p className="mt-3 text-[11px] uppercase tracking-[0.5em] text-[#c59e5a]">
          Collections
        </p>

        <div className="mt-6 flex items-center gap-4">
          <span className="h-px w-12 bg-[#c59e5a]/40" />
          <span className="text-[#c59e5a]/70">✦</span>
          <span className="h-px w-12 bg-[#c59e5a]/40" />
        </div>

        <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-[#e8cf9a]/70">
          {BRAND.tagline}
        </p>

        <h2 className="mt-14 font-serif text-5xl font-light tracking-[0.12em] text-[#e8cf9a] sm:text-6xl">
          LAUNCHING SOON
        </h2>

        <form
          action={formAction}
          className="mt-12 flex w-full max-w-md flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="Your email address"
            className="flex-1 border border-[#c59e5a]/40 bg-transparent px-5 py-4 text-sm text-[#e8cf9a] outline-none placeholder:text-[#c59e5a]/40 focus:border-[#c59e5a]"
          />
          <button
            type="submit"
            disabled={pending}
            className="bg-[#c59e5a] px-8 py-4 text-[11px] uppercase tracking-[0.25em] text-[#0b0906] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "…" : "Notify me"}
          </button>
        </form>

        <div aria-live="polite" className="mt-4 min-h-6">
          {state && "error" in state && (
            <p className="text-sm text-red-300">{state.error}</p>
          )}
          {state && "ok" in state && (
            <p className="text-sm text-[#e8cf9a]">{state.ok}</p>
          )}
        </div>

        <ul className="mt-16 grid grid-cols-2 gap-x-10 gap-y-8 sm:grid-cols-4">
          {FEATURES.map((f) => (
            <li key={f.label} className="flex flex-col items-center">
              <span
                aria-hidden
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[#c59e5a]/40 text-[#c59e5a]"
              >
                {f.icon}
              </span>
              <span className="mt-3 whitespace-pre-line text-[10px] uppercase leading-relaxed tracking-[0.2em] text-[#c59e5a]">
                {f.label}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-16 text-xs text-[#c59e5a]/50">{BRAND.email}</p>
      </div>
    </div>
  );
}
