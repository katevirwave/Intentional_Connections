import { upsertProfile } from '@/lib/api';
import { ageFromBirthDate } from '@/lib/age';
import { supabase } from '@/lib/supabase';
import { colors, font, radius, space } from '@/lib/theme';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function NameDobScreen() {
  const [firstName, setFirstName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);

  async function onContinue() {
    const name = firstName.trim();
    if (name.length < 1) {
      Alert.alert('Name', 'Please enter your first name.');
      return;
    }
    const iso = birthDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      Alert.alert('Birthday', 'Use format YYYY-MM-DD.');
      return;
    }
    const age = ageFromBirthDate(iso);
    if (age < 16) {
      Alert.alert('Age', 'You need to be at least 16 to use Intentional Connections.');
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Session', 'Please sign in again.');
      router.replace('/(auth)/welcome');
      return;
    }
    setLoading(true);
    try {
      await upsertProfile({
        id: user.id,
        first_name: name,
        birth_date: iso,
        gdpr_accepted_at: new Date().toISOString(),
      });
      router.replace('/question/today');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not save profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: 'About you' }} />
      <Text style={styles.helper}>
        Your answers are used only to calculate compatibility with people you choose to connect with. We do not share
        your answers with employers, advertisers, or any third party. You can delete your account and all your data
        at any time from Settings.
      </Text>
      <Text style={styles.label}>Your first name</Text>
      <TextInput
        style={styles.input}
        value={firstName}
        onChangeText={setFirstName}
        placeholder="Alex"
        placeholderTextColor={colors.textMuted}
      />
      <Text style={styles.label}>Your birthday (age is shown, not full date)</Text>
      <TextInput
        style={styles.input}
        value={birthDate}
        onChangeText={setBirthDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
      />
      <Pressable
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={() => void onContinue()}
        disabled={loading}
        accessibilityRole="button"
      >
        <Text style={styles.btnText}>{loading ? 'Saving…' : 'Continue'}</Text>
      </Pressable>
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
  helper: {
    fontSize: font.small,
    lineHeight: 20,
    color: colors.textMuted,
    marginBottom: space.md,
  },
  label: {
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
    backgroundColor: colors.surface,
    color: colors.text,
  },
  btn: {
    marginTop: space.lg,
    backgroundColor: colors.accent,
    paddingVertical: space.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: font.body },
});
