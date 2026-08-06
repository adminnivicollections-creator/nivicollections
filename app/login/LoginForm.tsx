"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    const supabase = createClient();
    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } },
          });

    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }
    if (mode === "signup") {
      setNotice("Check your email to confirm your address, then sign in.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  const field =
    "mt-1 w-full border border-ink/20 bg-transparent px-4 py-3 text-sm outline-none focus:border-ink";

  return (
    <form onSubmit={onSubmit} className="mt-10 space-y-5">
      {mode === "signup" && (
        <div>
          <label htmlFor="fullName" className="text-[11px] uppercase tracking-[0.2em] text-ink/60">
            Full name
          </label>
          <input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
            className={field}
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="text-[11px] uppercase tracking-[0.2em] text-ink/60">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className={field}
        />
      </div>

      <div>
        <label htmlFor="password" className="text-[11px] uppercase tracking-[0.2em] text-ink/60">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          className={field}
        />
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}
      {notice && <p className="text-sm text-gold">{notice}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-ink py-4 text-[11px] uppercase tracking-[0.25em] text-cream disabled:opacity-40"
      >
        {busy ? "Please wait" : mode === "signin" ? "Sign in" : "Create account"}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
          setNotice(null);
        }}
        className="w-full text-center text-xs text-ink/60 underline"
      >
        {mode === "signin"
          ? "New here? Create an account"
          : "Already have an account? Sign in"}
      </button>
    </form>
  );
}
