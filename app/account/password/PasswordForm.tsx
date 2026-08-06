"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function PasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }

    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password });
    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }
    router.push("/account");
    router.refresh();
  }

  const field =
    "mt-1 w-full border border-[#c59e5a]/30 bg-transparent px-4 py-3 text-sm text-[#f3e6cc] outline-none focus:border-[#c59e5a]";

  return (
    <form onSubmit={onSubmit} className="mt-10 space-y-5">
      <div>
        <label htmlFor="password" className="text-[11px] uppercase tracking-[0.2em] text-[#f3e6cc]/60">
          New password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={field}
        />
        <p className="mt-1 text-xs text-[#f3e6cc]/40">At least 8 characters.</p>
      </div>

      <div>
        <label htmlFor="confirm" className="text-[11px] uppercase tracking-[0.2em] text-[#f3e6cc]/60">
          Confirm password
        </label>
        <input
          id="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={field}
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-[#c59e5a] py-4 text-[11px] uppercase tracking-[0.25em] text-[#0b0906] disabled:opacity-40"
      >
        {busy ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
