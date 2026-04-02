import {
  ensureShareCode,
  fetchMyConnections,
  fetchProfile,
  updateShareRelationship,
} from '@/lib/api';
import { ageFromBirthDate } from '@/lib/age';
import { CONNECTION_UI_LABEL, RELATIONSHIP_LABELS } from '@/lib/questions';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import type { ConnectionRow, RelationshipType } from '@/lib/types';
import { colors, font, radius, space } from '@/lib/theme';
import { useSession } from '@/hooks/useSession';
import * as Clipboard from 'expo-clipboard';
import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const REL_OPTIONS: RelationshipType[] = ['romantic', 'friend', 'family', 'work', 'general'];

export default function HomeScreen() {
  const session = useSession();
  const userId = session?.user.id;
  const inviteRelationship = useAppStore((s) => s.inviteRelationship);
  const setInviteRelationship = useAppStore((s) => s.setInviteRelationship);

  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState<string | null>(null);
  const [connections, setConnections] = useState<ConnectionRow[]>([]);
  const [myAge, setMyAge] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const rel = useAppStore.getState().inviteRelationship;
      const [p, conns, sc] = await Promise.all([
        fetchProfile(userId),
        fetchMyConnections(userId),
        ensureShareCode(userId, rel),
      ]);
      setMyAge(p?.birth_date ? ageFromBirthDate(p.birth_date) : null);
      setConnections(conns.filter((c) => c.status !== 'declined' && c.status !== 'removed'));
      setCode(sc.code);
      if (sc.relationship_type !== rel) setInviteRelationship(sc.relationship_type);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not load home');
    } finally {
      setLoading(false);
    }
  }, [userId, setInviteRelationship]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const relOptions = useMemo(() => {
    if (myAge !== null && myAge < 18) return REL_OPTIONS.filter((r) => r !== 'romantic');
    return REL_OPTIONS;
  }, [myAge]);

  async function onPickRelationship(r: RelationshipType) {
    if (!userId) return;
    setInviteRelationship(r);
    try {
      await updateShareRelationship(userId, r);
      const sc = await ensureShareCode(userId, r);
      setCode(sc.code);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not update');
    }
  }

  async function copyCode() {
    if (!code) return;
    await Clipboard.setStringAsync(code);
  }

  async function shareOut() {
    if (!code) return;
    const url = `intentionalconnections://invite?code=${encodeURIComponent(code)}`;
    await Share.share({ message: `Connect with me on Intentional Connections. Code: ${code}\n${url}` });
  }

  if (session === undefined || !userId) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Home</Text>
      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginVertical: space.lg }} />
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Today&apos;s question</Text>
            <Text style={styles.cardBody}>One short question, about thirty seconds.</Text>
            <Link href="/question/today" asChild>
              <Pressable style={styles.primaryBtn} accessibilityRole="button">
                <Text style={styles.primaryBtnText}>Open today&apos;s question</Text>
              </Pressable>
            </Link>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your invite</Text>
            <Text style={styles.cardBody}>Choose how you know them before you share — this sets the default for your link.</Text>
            <View style={styles.relRow}>
              {relOptions.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => void onPickRelationship(r)}
                  style={[styles.relChip, inviteRelationship === r && styles.relChipOn]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.relChipText, inviteRelationship === r && styles.relChipTextOn]}>
                    {RELATIONSHIP_LABELS[r]}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.code}>{code ?? '—'}</Text>
            <View style={styles.row}>
              <Pressable style={styles.secondaryBtn} onPress={() => void copyCode()} accessibilityRole="button">
                <Text style={styles.secondaryBtnText}>Copy code</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={() => void shareOut()} accessibilityRole="button">
                <Text style={styles.secondaryBtnText}>Share link</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Connections</Text>
              <Link href="/connection/add" asChild>
                <Pressable accessibilityRole="button">
                  <Text style={styles.link}>Add</Text>
                </Pressable>
              </Link>
            </View>
            {connections.length === 0 ? (
              <Text style={styles.cardBody}>Share your code to connect with someone.</Text>
            ) : (
              connections.map((c) => (
                <ConnectionListRow key={c.id} c={c} me={userId} onOpen={() => router.push(`/connection/${c.id}`)} />
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function ConnectionListRow({
  c,
  me,
  onOpen,
}: {
  c: ConnectionRow;
  me: string;
  onOpen: () => void;
}) {
  const [name, setName] = useState<string>('…');
  const other = c.user_a === me ? c.user_b : c.user_a;

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const p = await fetchProfile(other);
        setName(p?.first_name ?? 'Someone');
      })();
    }, [other])
  );

  const mine = c.user_a === me ? c.relationship_type_a : c.relationship_type_b;
  const label = mine ? CONNECTION_UI_LABEL[mine] : c.status === 'pending' ? 'Pending' : 'Connection';

  return (
    <Pressable style={styles.connRow} onPress={onOpen} accessibilityRole="button">
      <Text style={styles.connName}>{name}</Text>
      <Text style={styles.connMeta}>
        {label} · {c.status === 'pending' ? 'Respond to invite' : 'View'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.md, backgroundColor: colors.bg, paddingBottom: space.xl * 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.sm,
  },
  cardTitle: { fontSize: font.body, fontWeight: '700', color: colors.text },
  cardBody: { fontSize: font.small, lineHeight: 20, color: colors.textMuted },
  primaryBtn: {
    marginTop: space.sm,
    backgroundColor: colors.accent,
    paddingVertical: space.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: font.body },
  relRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  relChip: {
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  relChipOn: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  relChipText: { fontSize: font.caption, color: colors.text },
  relChipTextOn: { color: colors.accent, fontWeight: '600' },
  code: {
    marginTop: space.sm,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.text,
    textAlign: 'center',
  },
  row: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  secondaryBtn: {
    flex: 1,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  secondaryBtnText: { fontWeight: '600', color: colors.text, fontSize: font.small },
  link: { color: colors.accent, fontWeight: '600', fontSize: font.small },
  connRow: {
    paddingVertical: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  connName: { fontSize: font.body, fontWeight: '600', color: colors.text },
  connMeta: { fontSize: font.caption, color: colors.textMuted, marginTop: 2 },
});
