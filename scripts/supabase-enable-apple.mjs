#!/usr/bin/env node
/**
 * Enables Sign in with Apple on your hosted Supabase project (Management API).
 * Loads `./.env` automatically — add SUPABASE_ACCESS_TOKEN there.
 *
 * Project ref: from EXPO_PUBLIC_SUPABASE_URL (e.g. https://abcd.supabase.co → abcd)
 * or SUPABASE_PROJECT_REF.
 *
 * Optional in .env (needed for Apple to actually work end-to-end):
 *   SUPABASE_AUTH_APPLE_CLIENT_ID  — Services ID (web) and/or bundle ID
 *   SUPABASE_AUTH_APPLE_SECRET     — JWT from Apple .p8 key (see Supabase Apple guide)
 */

import { loadRootEnv, projectRefFromPublicSupabaseUrl } from './load-root-env.mjs';

loadRootEnv();

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  const ref =
    process.env.SUPABASE_PROJECT_REF?.trim() || projectRefFromPublicSupabaseUrl();
  const publicUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();

  if (!publicUrl && !ref) {
    console.error('Set EXPO_PUBLIC_SUPABASE_URL in .env (or SUPABASE_PROJECT_REF).');
    process.exit(1);
  }

  if (!token || !ref) {
    console.error(
      'Missing SUPABASE_ACCESS_TOKEN or could not parse project ref.\n\n' +
        '1. Dashboard → Account → Access tokens → create token (needs project/auth access).\n' +
        '2. Add to .env:\n' +
        '     SUPABASE_ACCESS_TOKEN=sbp_...\n' +
        '3. Run: npm run supabase:auth:apple\n\n' +
        `Parsed ref: ${ref || '(none)'} from EXPO_PUBLIC_SUPABASE_URL`,
    );
    process.exit(1);
  }

  const body = { external_apple_enabled: true };
  const cid = process.env.SUPABASE_AUTH_APPLE_CLIENT_ID?.trim();
  const sec = process.env.SUPABASE_AUTH_APPLE_SECRET?.trim();
  if (cid) body.external_apple_client_id = cid;
  if (sec) body.external_apple_secret = sec;

  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`HTTP ${res.status}:`, text);
    process.exit(1);
  }

  console.log('OK — Apple provider enabled for project', ref + '.');
  if (!cid || !sec) {
    console.log(
      'Add SUPABASE_AUTH_APPLE_CLIENT_ID and SUPABASE_AUTH_APPLE_SECRET to .env, then run this again,\n' +
        'or paste them in Dashboard → Authentication → Providers → Apple.',
    );
  }
  if (text) console.log(text);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
