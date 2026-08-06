"use client";

import Image from "next/image";
import { useActionState } from "react";
import { BRAND } from "@/lib/config";
import { subscribe } from "./subscribe";

export function ComingSoon() {
  const [state, formAction, pending] = useActionState(subscribe, undefined);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#0b0906] px-4 py-10">
      <div className="w-full max-w-5xl">
        {/*
          The artwork already carries the logo, tagline, "Launching soon" and
          the four marks, so nothing here repeats them. Rendered contained
          rather than cropped, so the text stays intact at every width.
        */}
        <Image
          src="/images/nivicollectionslaunchingsoon.png"
          alt="Nivi Collections — timeless elegance, woven for you. Launching soon."
          width={1774}
          height={887}
          priority
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="h-auto w-full"
        />

        <div className="mx-auto mt-10 max-w-md px-2 text-center sm:mt-12">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#c59e5a]">
            Be the first to know
          </p>

          <form action={formAction} className="mt-5 flex flex-col gap-3 sm:flex-row">
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

          <p className="mt-8 text-xs text-[#c59e5a]/50">{BRAND.email}</p>
        </div>
      </div>
    </div>
  );
}
