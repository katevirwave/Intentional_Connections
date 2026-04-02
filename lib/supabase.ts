import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const fromEnv =
  (process.env.EXPO_PUBLIC_SUPABASE_URL ?? (Constants.expoConfig?.extra?.supabaseUrl as string | undefined) ?? '').trim();
const fromKeyEnv =
  (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    (Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined) ??
    '').trim();

/** True only when real project credentials are set (not dev placeholders). */
export function isSupabaseConfigured(): boolean {
  return Boolean(fromEnv && fromKeyEnv);
}

// createClient throws on empty URL; use placeholders so the app can render /setup without .env.
const supabaseUrl = fromEnv || 'https://placeholder.supabase.co';
const supabaseAnonKey =
  fromKeyEnv ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.placeholder-signature';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
