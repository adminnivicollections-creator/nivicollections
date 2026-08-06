import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

// Browser client. Only ever sees the publishable key, so every table it can
// reach must be protected by RLS.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
