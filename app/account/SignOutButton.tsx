"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await createClient().auth.signOut();
        router.push("/");
        router.refresh();
      }}
      className="text-[11px] uppercase tracking-[0.2em] text-ink/60 hover:text-ink"
    >
      Sign out
    </button>
  );
}
