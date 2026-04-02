import {
  ensureShareCode,
  fetchMyConnections,
  fetchProfile,
  updateShareRelationship,
} from '@/lib/api';
import { RelationshipChip } from '@/components/RelationshipChip';
import { SectionHeader } from '@/components/SectionHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ageFromBirthDate } from '@/lib/age';
import { hapticLight, hapticSelect } from '@/lib/haptics';
import { CONNECTION_UI_LABEL, RELATIONSHIP_LABELS } from '@/lib/questions';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import type { ConnectionRow, RelationshipType } from '@/lib/types';
import {
  cardPrimary,
  cardSecondary,
  colors,
  font,
  fontFamily,
  radius,
  shadows,
  space,
} from '@/lib/theme';
import { useSession } from '@/hooks/useSession';
import Ionicons from '@expo/vector-icons/Ionicons';
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
  const demoMode = useAppStore((s) => s.demoMode);
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
      if (demoMode) {
        setMyAge(28);
        setConnections([]);
        setCode('DEMO-F1X');
        return;
      }
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
  }, [userId, demoMode, setInviteRelationship]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const relOptions = useMemo(() => {
    if (myAge !== null && myAge < 18) return REL_OPTIONS.filter((r) => r !== 'romantic');
    return REL_OPTIONS;
  }, [myAge]);

  async function onPickRelationship(r: RelationshipType) {
    if (!userId) return;
    setInviteRelationship(r);
    if (demoMode) {
      return;
    }
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
    hapticLight();
    await Clipboard.setStringAsync(code);
  }

  async function shareOut() {
    if (!code) return;
    hapticSelect();
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
      {demoMode && (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>Demo mode — answers stay on this device only.</Text>
        </View>
      )}
      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginVertical: space.lg }} />
      ) : (
        <>
          <View style={styles.cardPrimary}>
            <SectionHeader title="Today&apos;s question" />
            <Text style={styles.cardBody}>One short question, about thirty seconds.</Text>
            <PrimaryButton label="Open today&apos;s question" onPress={() => router.push('/question/today')} />
          </View>

          <View style={styles.cardSecondary}>
            <SectionHeader title="Your invite" />
            <Text style={styles.cardBody}>
              Choose how you know them before you share — this sets the default for your link.
            </Text>
            <View style={styles.relRow}>
              {relOptions.map((r) => (
                <RelationshipChip
                  key={r}
                  label={RELATIONSHIP_LABELS[r]}
                  selected={inviteRelationship === r}
                  onPress={() => void onPickRelationship(r)}
                />
              ))}
            </View>
            <View style={styles.codeBox}>
              <Text style={styles.code}>{code ?? '—'}</Text>
            </View>
            <View style={styles.row}>
              <Pressable
                style={[styles.secondaryBtn, shadows.sm]}
                onPress={() => void copyCode()}
                accessibilityRole="button"
              >
                <Ionicons name="copy-outline" size={18} color={colors.accent} style={styles.btnIcon} />
                <Text style={styles.secondaryBtnText}>Copy code</Text>
              </Pressable>
              <Pressable
                style={[styles.secondaryBtn, shadows.sm]}
                onPress={() => void shareOut()}
                accessibilityRole="button"
              >
                <Ionicons name="share-outline" size={18} color={colors.accent} style={styles.btnIcon} />
                <Text style={styles.secondaryBtnText}>Share link</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.cardSecondary}>
            <SectionHeader
              title="Connections"
              right={
                !demoMode ? (
                  <Link href="/connection/add" asChild>
                    <Pressable accessibilityRole="button">
                      <Text style={styles.link}>Add</Text>
                    </Pressable>
                  </Link>
                ) : null
              }
            />
            {connections.length === 0 ? (
              <Text style={styles.cardBody}>
                {demoMode
                  ? 'With a real account, people who use your code show up here.'
                  : 'Share your code to connect with someone.'}
              </Text>
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
    }, [other]),
  );

  const mine = c.user_a === me ? c.relationship_type_a : c.relationship_type_b;
  const label = mine ? CONNECTION_UI_LABEL[mine] : c.status === 'pending' ? 'Pending' : 'Connection';

  return (
    <Pressable
      style={({ pressed }) => [styles.connRow, pressed && styles.connRowPressed]}
      onPress={() => {
        hapticLight();
        onOpen();
      }}
      accessibilityRole="button"
    >
      <View style={styles.connText}>
        <Text style={styles.connName}>{name}</Text>
        <Text style={styles.connMeta}>
          {label} · {c.status === 'pending' ? 'Respond to invite' : 'View'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.md, backgroundColor: colors.bg, paddingBottom: space.xl * 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  title: {
    fontFamily: fontFamily.heading,
    fontSize: font.display,
    fontWeight: '700',
    color: colors.text,
  },
  demoBanner: {
    backgroundColor: colors.accentMuted,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  demoBannerText: {
    fontFamily: fontFamily.body,
    fontSize: font.caption,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 18,
  },
  cardPrimary: {
    ...cardPrimary,
    gap: space.sm,
  },
  cardSecondary: {
    ...cardSecondary,
    gap: space.sm,
  },
  cardBody: {
    fontFamily: fontFamily.body,
    fontSize: font.small,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.textMuted,
  },
  relRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  codeBox: {
    marginTop: space.sm,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  code: {
    fontFamily: fontFamily.heading,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.text,
    textAlign: 'center',
  },
  row: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  btnIcon: { marginRight: 2 },
  secondaryBtnText: {
    fontFamily: fontFamily.bodySemi,
    fontWeight: '600',
    color: colors.text,
    fontSize: font.small,
  },
  link: {
    fontFamily: fontFamily.bodySemi,
    color: colors.accent,
    fontWeight: '600',
    fontSize: font.small,
  },
  connRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: space.sm,
  },
  connRowPressed: {
    backgroundColor: colors.accentMuted,
    marginHorizontal: -space.sm,
    paddingHorizontal: space.sm,
    borderRadius: radius.sm,
  },
  connText: { flex: 1 },
  connName: {
    fontFamily: fontFamily.bodySemi,
    fontSize: font.body,
    fontWeight: '600',
    color: colors.text,
  },
  connMeta: {
    fontFamily: fontFamily.body,
    fontSize: font.caption,
    fontWeight: '400',
    color: colors.textMuted,
    marginTop: 2,
  },
});
