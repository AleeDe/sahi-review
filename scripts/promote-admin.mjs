// Promote a user to admin role.
// Usage:  node scripts/promote-admin.mjs you@example.com
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  try {
    const txt = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}
loadEnv();

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/promote-admin.mjs <email>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: list, error: listErr } = await admin.auth.admin.listUsers({
  perPage: 1000,
});
if (listErr) {
  console.error(listErr.message);
  process.exit(1);
}
const user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) {
  console.error(`No user found with email ${email}. Have them sign in once first.`);
  process.exit(1);
}

const { error: updErr } = await admin.auth.admin.updateUserById(user.id, {
  app_metadata: { ...user.app_metadata, role: "admin" },
});
if (updErr) {
  console.error(updErr.message);
  process.exit(1);
}

console.log(`✓ ${email} promoted to admin. Sign out and back in for the change to take effect.`);
