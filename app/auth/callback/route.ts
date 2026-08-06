import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Landing point for OAuth providers (Google, Apple, ...), which use a
// `code` query param rather than the `token_hash` that email links use —
// hence a separate route from /auth/confirm.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=link_expired`);
  }

  // Only allow relative paths, so a crafted redirect cannot send a fresh
  // session to another site.
  const target = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  return NextResponse.redirect(`${origin}${target}`);
}
