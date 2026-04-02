#!/usr/bin/env node
/**
 * Run Supabase CLI with repo .env loaded. Project ref from EXPO_PUBLIC_SUPABASE_URL.
 *
 * Examples:
 *   node scripts/supabase-with-env.mjs config push --yes
 *   node scripts/supabase-with-env.mjs link --password "$DB_PASS"
 */

import { spawn } from 'child_process';
import { loadRootEnv, projectRefFromPublicSupabaseUrl } from './load-root-env.mjs';

loadRootEnv();

const ref = process.env.SUPABASE_PROJECT_REF?.trim() || projectRefFromPublicSupabaseUrl();
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node scripts/supabase-with-env.mjs <supabase-args...>');
  process.exit(1);
}

/** `config push` can target a project without `supabase link` if --project-ref is set. */
const needsRef = args[0] === 'config' && args[1] === 'push';

const hasRefFlag = args.includes('--project-ref');
const finalArgs = [...args];
if (needsRef && ref && !hasRefFlag) {
  finalArgs.push('--project-ref', ref);
}

const child = spawn('npx', ['supabase', ...finalArgs], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env },
});

child.on('exit', (code) => process.exit(code ?? 1));
