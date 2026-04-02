import { PrimaryButton } from '@/components/PrimaryButton';
import { upsertProfile } from '@/lib/api';
import { ageFromBirthDate } from '@/lib/age';
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

export default function NameDobScreen() {
  const [firstName, setFirstName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [dobFocused, setDobFocused] = useState(false);

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
      testID="onboarding-about-you"
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: 'About you' }} />
      <Text style={styles.helper}>
        Your answers are used only to calculate compatibility with people you choose to connect with. We do not share
        your answers with employers, advertisers, or any third party. You can delete your account and all your data at
        any time from Settings.
      </Text>
      <Text style={styles.label}>Your first name</Text>
      <TextInput
        testID="onboarding-first-name"
        style={[styles.input, nameFocused && styles.inputFocused]}
        value={firstName}
        onChangeText={setFirstName}
        onFocus={() => setNameFocused(true)}
        onBlur={() => setNameFocused(false)}
        placeholder="Alex"
        placeholderTextColor={colors.textMuted}
      />
      <Text style={styles.label}>Your birthday (age is shown, not full date)</Text>
      <TextInput
        testID="onboarding-birth-date"
        style={[styles.input, dobFocused && styles.inputFocused]}
        value={birthDate}
        onChangeText={setBirthDate}
        onFocus={() => setDobFocused(true)}
        onBlur={() => setDobFocused(false)}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
      />
      <PrimaryButton
        label={loading ? 'Saving…' : 'Continue'}
        testID="onboarding-submit"
        onPress={() => void onContinue()}
        disabled={loading}
        style={styles.btnTop}
      />
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
    fontFamily: fontFamily.body,
    fontSize: font.small,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.textMuted,
    marginBottom: space.md,
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
});
