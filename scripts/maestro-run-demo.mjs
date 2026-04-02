#!/usr/bin/env node
/**
 * Runs maestro/smoke-demo.yaml with the correct EXPO_DEV_URL for *this* repo,
 * even when another Metro is already on 8081.
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

import { loadRootEnv } from './load-root-env.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

loadRootEnv();

const SLUG_MARKERS = ['Intentional_Connections', 'intentional_connections', 'Intentional Connections'];

async function metroRunning(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/status`, { signal: AbortSignal.timeout(800) });
    const t = await res.text();
    return res.ok && t.includes('packager-status:running');
  } catch {
    return false;
  }
}

async function isThisProject(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(2500) });
    const html = await res.text();
    return SLUG_MARKERS.some((m) => html.includes(m));
  } catch {
    return false;
  }
}

async function resolvePort() {
  const explicit = process.env.EXPO_METRO_PORT?.trim();
  const ports = explicit
    ? [Number(explicit, 10)]
    : [8081, 8085, 8082, 19000, 8083, 8084];

  for (const port of ports) {
    if (!Number.isFinite(port)) continue;
    if (!(await metroRunning(port))) continue;
    if (await isThisProject(port)) {
      return port;
    }
  }

  for (const port of ports) {
    if (Number.isFinite(port) && (await metroRunning(port))) {
      console.warn(
        `Could not confirm project slug on port ${port}; using it anyway. Set EXPO_METRO_PORT or EXPO_DEV_URL if the wrong app opens.`,
      );
      return port;
    }
  }

  return 8081;
}

const urlFromEnv = process.env.EXPO_DEV_URL?.trim();
const port = urlFromEnv ? null : await resolvePort();
const expoUrl = urlFromEnv || `exp://127.0.0.1:${port}`;

console.log('Maestro EXPO_DEV_URL =', expoUrl);

const r = spawnSync(
  'maestro',
  ['test', 'maestro/smoke-demo.yaml', '-e', `EXPO_DEV_URL=${expoUrl}`],
  { stdio: 'inherit', cwd: ROOT, shell: false },
);

process.exit(r.status ?? 1);
