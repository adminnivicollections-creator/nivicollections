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
      className="text-[11px] uppercase tracking-[0.2em] text-[#f3e6cc]/60 hover:text-[#f3e6cc]"
    >
      Sign out
    </button>
  );
}
