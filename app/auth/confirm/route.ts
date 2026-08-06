import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Landing point for every emailed link: signup confirmation, password
// recovery, email change and invites. Supabase sends the user here with a
// one-time token_hash, which is exchanged for a session exactly once.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/account";

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    // Expired or already-used links land here.
    return NextResponse.redirect(`${origin}/login?error=link_expired`);
  }

  // Only allow relative paths, so a crafted link cannot bounce the user
  // to another site carrying a fresh session.
  const target = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  return NextResponse.redirect(`${origin}${target}`);
}
