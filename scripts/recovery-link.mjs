// Print a one-time password-recovery link for a user, bypassing email.
//
//   node --env-file=.env.local scripts/recovery-link.mjs you@example.com
//
// Useful when SMTP is not set up yet, or for an invited account that has no
// password. The link is single-use and expires; open it in the same browser.
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
if (!email) {
  console.error("usage: node scripts/recovery-link.mjs <email>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await supabase.auth.admin.generateLink({
  type: "recovery",
  email,
  options: { redirectTo: `${site}/auth/confirm?next=/account/password` },
});

if (error) {
  console.error("Could not generate link:", error.message);
  process.exit(1);
}

// Supabase's own link points at its verify endpoint, which then bounces to
// redirectTo. Hitting our route directly with the token hash skips that hop
// and works even when the project's Site URL is not configured yet.
const params = new URLSearchParams({
  token_hash: data.properties.hashed_token,
  type: "recovery",
  next: "/account/password",
});

console.log(`\nOpen this once, in the browser you want to be signed in:\n`);
console.log(`${site}/auth/confirm?${params}\n`);
