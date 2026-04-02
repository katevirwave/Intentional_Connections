import {
  createPendingConnection,
  fetchConnectionBetweenUsers,
  lookupShareCode,
} from '@/lib/api';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useDemoGuardRedirectToTabs } from '@/hooks/useDemoGuard';
import { supabase } from '@/lib/supabase';
import { colors, font, fontFamily, radius, space } from '@/lib/theme';
import { router, Stack } from 'expo-router';
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

export default function AddConnectionScreen() {
  useDemoGuardRedirectToTabs();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  async function onSubmit() {
    const c = code.trim().toUpperCase();
    if (c.length < 3) {
      Alert.alert('Code', 'Enter a valid code.');
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/(auth)/welcome');
      return;
    }
    setLoading(true);
    try {
      const found = await lookupShareCode(c);
      if (!found) {
        Alert.alert('Not found', 'No one is using that code right now.');
        return;
      }
      if (found.owner_id === user.id) {
        Alert.alert('That is you', 'Share this code with someone else.');
        return;
      }
      const existing = await fetchConnectionBetweenUsers(user.id, found.owner_id);
      if (existing?.status === 'active') {
        Alert.alert('Already connected', 'You are already connected with this person.');
        router.replace(`/connection/${existing.id}`);
        return;
      }
      if (existing?.status === 'pending') {
        router.replace(`/connection/invite?connectionId=${existing.id}`);
        return;
      }
      const row = await createPendingConnection({
        inviterId: found.owner_id,
        inviteeId: user.id,
        inviterRelationship: found.relationship_type,
      });
      router.replace(`/connection/invite?connectionId=${row.id}`);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: 'Add connection' }} />
      <Text style={styles.body}>Enter the code they shared with you.</Text>
      <TextInput
        style={[styles.input, focused && styles.inputFocused]}
        value={code}
        onChangeText={setCode}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="characters"
        placeholder="XK7-91R"
        placeholderTextColor={colors.textMuted}
      />
      <PrimaryButton
        label={loading ? 'Working…' : 'Continue'}
        onPress={() => void onSubmit()}
        disabled={loading}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: space.lg, gap: space.md },
  body: {
    fontFamily: fontFamily.body,
    fontSize: font.body,
    fontWeight: '400',
    color: colors.textMuted,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontSize: 22,
    letterSpacing: 2,
    fontFamily: fontFamily.headingSemi,
    fontWeight: '600',
    backgroundColor: colors.surface,
    color: colors.text,
  },
  inputFocused: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
});
