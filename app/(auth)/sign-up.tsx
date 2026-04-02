import { PrimaryButton } from '@/components/PrimaryButton';
import { SocialAuthButtons } from '@/components/SocialAuthButtons';
import { useAppStore } from '@/lib/store';
import { colors, font, fontFamily, radius, space } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { Link, router, Stack } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function SignUpScreen() {
  const exitDemoMode = useAppStore((s) => s.exitDemoMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  async function onSubmit() {
    if (!email.trim() || password.length < 6) {
      Alert.alert('Check details', 'Use a valid email and a password of at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      Alert.alert('Sign up failed', error.message);
      return;
    }
    exitDemoMode();
    router.replace('/onboarding/name-dob');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: 'Create account' }} />
      <SocialAuthButtons onSuccess={exitDemoMode} />
      <Text style={styles.label}>Email</Text>
      <TextInput
        testID="signup-email"
        style={[styles.input, emailFocused && styles.inputFocused]}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        onFocus={() => setEmailFocused(true)}
        onBlur={() => setEmailFocused(false)}
        placeholder="you@example.com"
        placeholderTextColor={colors.textMuted}
      />
      <Text style={styles.label}>Password</Text>
      <TextInput
        testID="signup-password"
        style={[styles.input, passwordFocused && styles.inputFocused]}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        onFocus={() => setPasswordFocused(true)}
        onBlur={() => setPasswordFocused(false)}
        placeholder="At least 6 characters"
        placeholderTextColor={colors.textMuted}
      />
      <PrimaryButton
        label={loading ? 'Creating…' : 'Continue'}
        testID="signup-submit"
        onPress={() => void onSubmit()}
        disabled={loading}
        style={styles.btnTop}
      />
      <Link href="/(auth)/log-in" style={styles.link}>
        Already have an account? Log in
      </Link>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: space.lg,
    gap: space.sm,
  },
  label: {
    fontFamily: fontFamily.bodySemi,
    fontSize: font.small,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: space.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontSize: font.body,
    fontFamily: fontFamily.body,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  inputFocused: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  btnTop: { marginTop: space.lg },
  link: {
    marginTop: space.md,
    color: colors.accent,
    fontSize: font.small,
    fontFamily: fontFamily.bodySemi,
    fontWeight: '600',
  },
});
