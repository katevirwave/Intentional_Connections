import { PrimaryButton } from '@/components/PrimaryButton';
import {
  formatSignInError,
  signInWithApple,
  signInWithGoogle,
  type SocialAuthProvider,
} from '@/lib/oauth';
import { supabase } from '@/lib/supabase';
import { colors, fontFamily, space } from '@/lib/theme';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

type Props = {
  onSuccess: () => void;
};

export function SocialAuthButtons({ onSuccess }: Props) {
  const [busy, setBusy] = useState<'google' | 'apple' | null>(null);

  const run = useCallback(
    async (which: SocialAuthProvider) => {
      setBusy(which);
      const { error } = which === 'google' ? await signInWithGoogle() : await signInWithApple();
      setBusy(null);
      if (error) {
        Alert.alert('Sign in failed', formatSignInError(error, which));
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        return;
      }
      onSuccess();
      router.replace('/');
    },
    [onSuccess],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or with email</Text>
        <View style={styles.dividerLine} />
      </View>
      <PrimaryButton
        label={busy === 'google' ? 'Opening Google…' : 'Continue with Google'}
        onPress={() => void run('google')}
        disabled={busy !== null}
        variant="outline"
      />
      <PrimaryButton
        label={busy === 'apple' ? 'Signing in…' : 'Continue with Apple'}
        onPress={() => void run('apple')}
        disabled={busy !== null}
        variant="outline"
        style={styles.appleBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.sm,
    marginBottom: space.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: space.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  appleBtn: {
    marginTop: 0,
  },
});
