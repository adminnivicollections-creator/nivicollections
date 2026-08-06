// Promote an existing signed-up user to admin.
//
//   node --env-file=.env.local scripts/make-admin.mjs you@example.com
//
// The role lives in public.profiles and is only ever read server-side with the
// service key, so it cannot be forged from the browser.
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
if (!email) {
  console.error("usage: node scripts/make-admin.mjs <email>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data: list, error: listError } = await supabase.auth.admin.listUsers();
if (listError) {
  console.error("Could not list users:", listError.message);
  process.exit(1);
}

const user = list.users.find(
  (u) => u.email?.toLowerCase() === email.toLowerCase(),
);
if (!user) {
  console.error(
    `No user with email ${email}. Sign up at /login first, then re-run this.`,
  );
  process.exit(1);
}

const { error } = await supabase
  .from("profiles")
  .update({ role: "admin" })
  .eq("id", user.id);

if (error) {
  console.error("Could not set role:", error.message);
  process.exit(1);
}

const confirmed = Boolean(user.email_confirmed_at);
console.log(`${email} is now an admin.`);
if (!confirmed) {
  console.log(
    "Note: this email is not confirmed yet, so sign-in will fail until you " +
      "confirm it (check your inbox, or confirm the user in the Supabase " +
      "dashboard under Authentication > Users).",
  );
}
