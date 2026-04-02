#!/usr/bin/env node
/**
 * Enables Google OAuth on the hosted project (Management API PATCH).
 * Loads `./.env` automatically (same as Apple script).
 *
 * Optional in .env:
 *   SUPABASE_AUTH_GOOGLE_CLIENT_ID
 *   SUPABASE_AUTH_GOOGLE_SECRET  (Google client secret — maps to Supabase external_google_secret)
 */

import { loadRootEnv, projectRefFromPublicSupabaseUrl } from './load-root-env.mjs';

loadRootEnv();

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  let ref = process.env.SUPABASE_PROJECT_REF?.trim() || projectRefFromPublicSupabaseUrl();

  if (!token || !ref) {
    console.error(
      'Missing SUPABASE_ACCESS_TOKEN or project ref.\n' +
        'Add SUPABASE_ACCESS_TOKEN to .env (Dashboard → Account → Access tokens).\n' +
        'Ref is read from EXPO_PUBLIC_SUPABASE_URL unless SUPABASE_PROJECT_REF is set.',
    );
    process.exit(1);
  }

  const body = { external_google_enabled: true };
  const cid = process.env.SUPABASE_AUTH_GOOGLE_CLIENT_ID?.trim();
  const sec =
    process.env.SUPABASE_AUTH_GOOGLE_SECRET?.trim() ||
    process.env.SUPABASE_AUTH_GOOGLE_CLIENT_SECRET?.trim();
  if (cid) body.external_google_client_id = cid;
  if (sec) body.external_google_secret = sec;

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

  console.log('OK — Google provider enabled for', ref + '.');
  if (!cid || !sec) {
    console.log('Add SUPABASE_AUTH_GOOGLE_CLIENT_ID and SUPABASE_AUTH_GOOGLE_SECRET to .env and re-run, or finish in Dashboard.');
  }
  if (text) console.log(text);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
