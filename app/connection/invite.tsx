import {
  acceptConnection,
  declineConnection,
  fetchConnectionById,
  fetchProfile,
  inviterTowardInviteeType,
} from '@/lib/api';
import { ageFromBirthDate } from '@/lib/age';
import { RELATIONSHIP_LABELS } from '@/lib/questions';
import { supabase } from '@/lib/supabase';
import type { RelationshipType } from '@/lib/types';
import { colors, font, radius, space } from '@/lib/theme';
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
              <Pressable
                key={r}
                onPress={() => setMine(r)}
                style={[styles.relChip, mine === r && styles.relChipOn]}
                accessibilityRole="button"
              >
                <Text style={[styles.relChipText, mine === r && styles.relChipTextOn]}>{RELATIONSHIP_LABELS[r]}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={[styles.primary, busy && styles.disabled]}
            onPress={() => void onAccept()}
            disabled={busy}
            accessibilityRole="button"
          >
            <Text style={styles.primaryText}>{busy ? 'Working…' : 'Accept'}</Text>
          </Pressable>
          <Pressable
            style={[styles.secondary, busy && styles.disabled]}
            onPress={() => void onDecline()}
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
  headline: { fontSize: font.title, fontWeight: '700', color: colors.text, lineHeight: 30 },
  body: { fontSize: font.body, lineHeight: 24, color: colors.textMuted },
  section: { marginTop: space.md, fontWeight: '700', color: colors.text, fontSize: font.body },
  relRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  relChip: {
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  relChipOn: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  relChipText: { fontSize: font.caption, color: colors.text },
  relChipTextOn: { color: colors.accent, fontWeight: '600' },
  primary: {
    marginTop: space.md,
    backgroundColor: colors.accent,
    paddingVertical: space.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: font.body },
  secondary: {
    paddingVertical: space.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryText: { color: colors.text, fontWeight: '600', fontSize: font.body },
  disabled: { opacity: 0.6 },
});
