import {
  acceptConnection,
  declineConnection,
  fetchConnectionById,
  fetchProfile,
  inviterTowardInviteeType,
} from '@/lib/api';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RelationshipChip } from '@/components/RelationshipChip';
import { ageFromBirthDate } from '@/lib/age';
import { hapticLight } from '@/lib/haptics';
import { RELATIONSHIP_LABELS } from '@/lib/questions';
import { useDemoGuardRedirectToTabs } from '@/hooks/useDemoGuard';
import { supabase } from '@/lib/supabase';
import type { RelationshipType } from '@/lib/types';
import { colors, font, fontFamily, radius, shadows, space } from '@/lib/theme';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const REL_OPTIONS: RelationshipType[] = ['romantic', 'friend', 'family', 'work', 'general'];

export default function InviteScreen() {
  useDemoGuardRedirectToTabs();
  const { connectionId } = useLocalSearchParams<{ connectionId: string }>();
  const [initialLoad, setInitialLoad] = useState(true);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('Someone');
  const [theirLabel, setTheirLabel] = useState<string>('');
  const [mine, setMine] = useState<RelationshipType>('friend');
  const [myAge, setMyAge] = useState<number | null>(null);
  const [iAmInvitee, setIAmInvitee] = useState(false);

  const load = useCallback(async () => {
    if (!connectionId) {
      setInitialLoad(false);
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/(auth)/welcome');
      return;
    }
    setBusy(true);
    try {
      const c = await fetchConnectionById(String(connectionId));
      if (!c) {
        Alert.alert('Missing', 'That invite is no longer available.');
        router.replace('/(tabs)');
        return;
      }
      const other = c.user_a === user.id ? c.user_b : c.user_a;
      const inv = c.inviter_id;
      setIAmInvitee(inv !== user.id);
      const p = await fetchProfile(other);
      setName(p?.first_name ?? 'Someone');
      const meProfile = await fetchProfile(user.id);
      setMyAge(meProfile?.birth_date ? ageFromBirthDate(meProfile.birth_date) : null);
      const t = inviterTowardInviteeType(c);
      setTheirLabel(t ? RELATIONSHIP_LABELS[t] : RELATIONSHIP_LABELS.general);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not load invite');
    } finally {
      setBusy(false);
      setInitialLoad(false);
    }
  }, [connectionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const relOptions = useMemo(() => {
    if (myAge !== null && myAge < 18) return REL_OPTIONS.filter((r) => r !== 'romantic');
    return REL_OPTIONS;
  }, [myAge]);

  async function onAccept() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !connectionId) return;
    setBusy(true);
    try {
      await acceptConnection(String(connectionId), user.id, mine);
      router.replace(`/connection/${String(connectionId)}`);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not accept');
    } finally {
      setBusy(false);
    }
  }

  async function onDecline() {
    if (!connectionId) return;
    setBusy(true);
    try {
      await declineConnection(String(connectionId));
      router.replace('/(tabs)');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not decline');
    } finally {
      setBusy(false);
    }
  }

  if (initialLoad) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Invite' }} />
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Invite' }} />
      <Text style={styles.headline}>
        {iAmInvitee ? `${name} wants to connect with you on 100.` : `You invited ${name} on 100.`}
      </Text>
      {iAmInvitee ? (
        <Text style={styles.body}>They&apos;ve described your relationship as: {theirLabel}</Text>
      ) : (
        <Text style={styles.body}>You described the relationship as: {theirLabel}</Text>
      )}
      {iAmInvitee ? (
        <>
          <Text style={styles.section}>How do you see them?</Text>
          <View style={styles.relRow}>
            {relOptions.map((r) => (
              <RelationshipChip
                key={r}
                label={RELATIONSHIP_LABELS[r]}
                selected={mine === r}
                onPress={() => setMine(r)}
              />
            ))}
          </View>
          <PrimaryButton
            label={busy ? 'Working…' : 'Accept'}
            onPress={() => void onAccept()}
            disabled={busy}
            style={styles.primaryGap}
          />
          <Pressable
            style={[styles.secondary, shadows.sm, busy && styles.disabled]}
            onPress={() => {
              hapticLight();
              void onDecline();
            }}
            disabled={busy}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryText}>Decline</Text>
          </Pressable>
        </>
      ) : (
        <Text style={styles.body}>Waiting for them to accept your invite.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  container: { padding: space.lg, gap: space.md, backgroundColor: colors.bg },
  headline: {
    fontFamily: fontFamily.heading,
    fontSize: font.title,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 30,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: font.body,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.textMuted,
  },
  section: {
    marginTop: space.md,
    fontFamily: fontFamily.headingSemi,
    fontWeight: '600',
    color: colors.text,
    fontSize: font.body,
  },
  relRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  primaryGap: { marginTop: space.md },
  secondary: {
    paddingVertical: space.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryText: {
    fontFamily: fontFamily.bodySemi,
    color: colors.text,
    fontWeight: '600',
    fontSize: font.body,
  },
  disabled: { opacity: 0.6 },
});
