// Create or update the shop's categories. Safe to re-run: matches on slug.
//
//   node --env-file=.env.local scripts/seed-categories.mjs
//
// Products are added through /admin, not here.
import { createClient } from "@supabase/supabase-js";

const CATEGORIES = [{ slug: "sarees", name: "Sarees", position: 0 }];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await supabase
  .from("categories")
  .upsert(CATEGORIES, { onConflict: "slug" })
  .select("slug, name");

if (error) {
  console.error("Seed failed:", error.message);
  process.exit(1);
}

console.log(`Seeded ${data.length} categor${data.length === 1 ? "y" : "ies"}:`);
for (const c of data) console.log(`  ${c.slug} — ${c.name}`);
