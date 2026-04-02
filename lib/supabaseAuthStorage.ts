import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Supabase auth expects a Storage-like API with async get/set/remove.
 * On native we use Expo SecureStore (always available in Expo Go) instead of
 * AsyncStorage, which can surface "Native module is null" in some SDK / New Arch combinations.
 * Values may exceed SecureStore's per-item limit, so we chunk them.
 */
const CHUNK_SIZE = 1900;
const KEY_PREFIX = 'ic.sb.auth.';

function metaKey(key: string) {
  return `${KEY_PREFIX}${key}.__n`;
}

function chunkKey(key: string, index: number) {
  return `${KEY_PREFIX}${key}.__${index}`;
}

function splitChunks(value: string): string[] {
  if (value.length === 0) {
    return [''];
  }
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    chunks.push(value.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
}

async function removeNative(key: string): Promise<void> {
  const nStr = await SecureStore.getItemAsync(metaKey(key));
  await SecureStore.deleteItemAsync(metaKey(key)).catch(() => undefined);
  if (!nStr) {
    return;
  }
  const n = parseInt(nStr, 10);
  if (!Number.isFinite(n) || n < 1) {
    return;
  }
  for (let i = 0; i < n; i++) {
    await SecureStore.deleteItemAsync(chunkKey(key, i)).catch(() => undefined);
  }
}

export const supabaseAuthStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      if (typeof globalThis.localStorage === 'undefined') {
        return null;
      }
      return globalThis.localStorage.getItem(key);
    }

    const nStr = await SecureStore.getItemAsync(metaKey(key));
    if (!nStr) {
      return null;
    }
    const n = parseInt(nStr, 10);
    if (!Number.isFinite(n) || n < 1) {
      return null;
    }
    let acc = '';
    for (let i = 0; i < n; i++) {
      const part = await SecureStore.getItemAsync(chunkKey(key, i));
      if (part == null) {
        return null;
      }
      acc += part;
    }
    return acc;
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof globalThis.localStorage !== 'undefined') {
        globalThis.localStorage.setItem(key, value);
      }
      return;
    }

    await removeNative(key);
    const chunks = splitChunks(value);
    await SecureStore.setItemAsync(metaKey(key), String(chunks.length));
    for (let i = 0; i < chunks.length; i++) {
      await SecureStore.setItemAsync(chunkKey(key, i), chunks[i]);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof globalThis.localStorage !== 'undefined') {
        globalThis.localStorage.removeItem(key);
      }
      return;
    }
    await removeNative(key);
  },
};
