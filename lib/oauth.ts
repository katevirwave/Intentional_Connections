import { getConfiguredSupabaseHost, supabase } from '@/lib/supabase';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

export type SocialAuthProvider = 'google' | 'apple';

/** User-facing copy when Supabase returns provider / config errors */
export function formatSignInError(err: unknown, provider?: SocialAuthProvider): string {
  const msg =
    err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string'
      ? (err as { message: string }).message
      : err instanceof Error
        ? err.message
        : 'Something went wrong';

  if (/provider is not enabled|Unsupported provider|validation_failed/i.test(msg)) {
    const host = getConfiguredSupabaseHost();
    const name = provider === 'google' ? 'Google' : provider === 'apple' ? 'Apple' : 'this provider';
    const providersPath =
      provider === 'google'
        ? 'Authentication → Providers → Google'
        : provider === 'apple'
          ? 'Authentication → Providers → Apple'
          : 'Authentication → Providers';
    const where = host
      ? `\n\nThis build is using ${host}. In the Dashboard, open that project → ${providersPath} and enable it. If it’s enabled on a different project or .env URL, it won’t apply here.`
      : '';
    return `Supabase returned “provider not enabled” for ${name}.${where}`;
  }

  return msg;
}

function firstQueryValue(value: string | string[] | undefined): string | null {
  if (value == null) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

/**
 * Supabase returns 400 JSON when a provider is disabled. Probing with redirect:manual
 * avoids opening the in-app browser on that error page.
 */
async function probeSupabaseOAuthUrl(url: string): Promise<Error | null> {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'manual' });
    if (res.status >= 300 && res.status < 400) {
      return null;
    }
    if (res.status === 400) {
      const text = await res.text();
      try {
        const j = JSON.parse(text) as { msg?: string; message?: string };
        const m = j.msg ?? j.message ?? text;
        return new Error(typeof m === 'string' ? m : text);
      } catch {
        return new Error(text.slice(0, 280));
      }
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return new Error(text?.trim() || `Sign-in request failed (${res.status})`);
    }
    return null;
  } catch {
    return null;
  }
}

function parseOAuthRedirect(url: string): { code: string | null; accessToken: string | null; refreshToken: string | null } {
  const { queryParams } = Linking.parse(url);
  const code = firstQueryValue(queryParams?.code);

  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) {
    return { code, accessToken: null, refreshToken: null };
  }
  const fragment = url.slice(hashIndex + 1);
  const params = new URLSearchParams(fragment);
  return {
    code,
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
  };
}

async function openOAuthAndExchange(provider: 'google' | 'apple'): Promise<{ error: Error | null }> {
  const redirectTo = Linking.createURL('/');
  const { data, error: oauthErr } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (oauthErr) {
    return { error: oauthErr };
  }
  if (!data?.url) {
    return { error: new Error('Could not start sign-in') };
  }

  const probeErr = await probeSupabaseOAuthUrl(data.url);
  if (probeErr) {
    return { error: probeErr };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === 'cancel' || result.type === 'dismiss') {
    return { error: null };
  }
  if (result.type !== 'success' || !result.url) {
    return { error: new Error('Sign in was not completed') };
  }

  const { code, accessToken, refreshToken } = parseOAuthRedirect(result.url);

  if (code) {
    const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
    return { error: exchangeErr };
  }
  if (accessToken && refreshToken) {
    const { error: sessionErr } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    return { error: sessionErr };
  }

  return { error: new Error('Missing authorization from provider') };
}

export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  return openOAuthAndExchange('google');
}

function isAppleUserCanceled(e: unknown): boolean {
  const code =
    e && typeof e === 'object' && 'code' in e ? String((e as { code: unknown }).code) : '';
  return code === 'ERR_REQUEST_CANCELED' || code === 'ERR_CANCELED';
}

async function signInWithAppleNative(): Promise<{ error: Error | null }> {
  const rawNonce = Crypto.randomUUID().replace(/-/g, '');
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      return { error: new Error('Apple did not return an identity token') };
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce,
    });
    return { error };
  } catch (e: unknown) {
    if (isAppleUserCanceled(e)) {
      return { error: null };
    }
    return { error: e instanceof Error ? e : new Error('Apple sign in failed') };
  }
}

/** Apple: native on iOS when available; OAuth web flow elsewhere (e.g. Android). */
export async function signInWithApple(): Promise<{ error: Error | null }> {
  if (Platform.OS === 'ios') {
    try {
      const available = await AppleAuthentication.isAvailableAsync();
      if (available) {
        return signInWithAppleNative();
      }
    } catch {
      // fall through to OAuth
    }
  }
  return openOAuthAndExchange('apple');
}
