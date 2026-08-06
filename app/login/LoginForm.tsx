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

  async function onGoogle() {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    // On success the browser navigates away to Google immediately; an error
    // here means the request to start that redirect itself failed.
    if (error) setError(error.message);
  }

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
    "mt-1 w-full border border-[#c59e5a]/30 bg-transparent px-4 py-3 text-sm text-[#f3e6cc] outline-none focus:border-[#c59e5a]";

  return (
    <form onSubmit={onSubmit} className="mt-10 space-y-5">
      {mode === "signup" && (
        <div>
          <label htmlFor="fullName" className="text-[11px] uppercase tracking-[0.2em] text-[#f3e6cc]/60">
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
        <label htmlFor="email" className="text-[11px] uppercase tracking-[0.2em] text-[#f3e6cc]/60">
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
        <label htmlFor="password" className="text-[11px] uppercase tracking-[0.2em] text-[#f3e6cc]/60">
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

      {error && <p className="text-sm text-red-400">{error}</p>}
      {notice && <p className="text-sm text-[#c59e5a]">{notice}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-[#c59e5a] py-4 text-[11px] uppercase tracking-[0.25em] text-[#0b0906] disabled:opacity-40"
      >
        {busy ? "Please wait" : mode === "signin" ? "Sign in" : "Create account"}
      </button>

      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-[#c59e5a]/20" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#f3e6cc]/40">
          or
        </span>
        <span className="h-px flex-1 bg-[#c59e5a]/20" />
      </div>

      <button
        type="button"
        onClick={onGoogle}
        className="flex w-full items-center justify-center gap-3 border border-[#c59e5a]/30 bg-[#f3e6cc] py-4 text-[11px] uppercase tracking-[0.2em] text-[#0b0906] hover:bg-white"
      >
        <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62Z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18Z"
          />
          <path
            fill="#FBBC05"
            d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.98a9 9 0 0 0 0 8.06l2.97-2.33Z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .98 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58Z"
          />
        </svg>
        Continue with Google
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
          setNotice(null);
        }}
        className="w-full text-center text-xs text-[#f3e6cc]/60 underline"
      >
        {mode === "signin"
          ? "New here? Create an account"
          : "Already have an account? Sign in"}
      </button>
    </form>
  );
}
