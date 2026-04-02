import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.join(__dirname, '..');

/**
 * Load repo `.env` into `process.env` (does not override non-empty vars already set).
 */
export function loadRootEnv() {
  const p = path.join(REPO_ROOT, '.env');
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, 'utf8');
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (!key) continue;
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    const cur = process.env[key];
    if (cur === undefined || cur === '') {
      process.env[key] = val;
    }
  }
}

export function projectRefFromPublicSupabaseUrl() {
  const publicUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  if (!publicUrl) return null;
  try {
    return new URL(publicUrl).hostname.replace(/\.supabase\.co$/i, '');
  } catch {
    return null;
  }
}
