// Write one env var into .env.local from the macOS clipboard, so secrets never
// pass through a chat transcript or a shell history entry.
//
//   node scripts/set-env.mjs NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
//
// Prints only the length and prefix of what it wrote, never the value.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ENV_PATH = join(dirname(dirname(fileURLToPath(import.meta.url))), ".env.local");

// Expected prefixes, so a wrong copy-paste is caught immediately.
const EXPECTED = {
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_",
  SUPABASE_SECRET_KEY: "sb_secret_",
  NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_",
  RESEND_API_KEY: "re_",
};

const name = process.argv[2];
if (!name) {
  console.error("usage: node scripts/set-env.mjs <ENV_VAR_NAME>");
  process.exit(1);
}
if (!existsSync(ENV_PATH)) {
  console.error(`${ENV_PATH} does not exist. Copy .env.example to .env.local first.`);
  process.exit(1);
}

const value = execFileSync("pbpaste").toString().trim();

if (!value) {
  console.error("Clipboard is empty. Copy the key first, then re-run.");
  process.exit(1);
}
if (/\s/.test(value)) {
  console.error("Clipboard contains whitespace — that is not a key. Re-copy it.");
  process.exit(1);
}
const expected = EXPECTED[name];
if (expected && !value.startsWith(expected)) {
  console.error(
    `Clipboard does not start with "${expected}" — you copied the wrong field. Nothing written.`,
  );
  process.exit(1);
}

const original = readFileSync(ENV_PATH, "utf8");
const line = `${name}=${value}`;
const pattern = new RegExp(`^${name}=.*$`, "m");
const updated = pattern.test(original)
  ? original.replace(pattern, line)
  : `${original.replace(/\n*$/, "\n")}${line}\n`;

writeFileSync(ENV_PATH, updated);
console.log(`Wrote ${name} (${value.length} chars, starts "${value.slice(0, 14)}…")`);
