import {
  ensureShareCode,
  fetchMyConnections,
  fetchProfile,
  updateShareRelationship,
} from '@/lib/api';
import { RelationshipChip } from '@/components/RelationshipChip';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ageFromBirthDate } from '@/lib/age';
import { hapticLight, hapticSelect } from '@/lib/haptics';
import { CONNECTION_UI_LABEL, RELATIONSHIP_LABELS } from '@/lib/questions';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import type { ConnectionRow, RelationshipType } from '@/lib/types';
import {
  colors,
  font,
  fontFamily,
  gradients,
  radius,
  shadows,
  space,
} from '@/lib/theme';
import { useSession } from '@/hooks/useSession';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const REL_OPTIONS: RelationshipType[] = ['romantic', 'friend', 'family', 'work', 'general'];

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
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
    <View style={styles.screenRoot}>
      <LinearGradient
        colors={[...gradients.heroShort]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.35, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.heroOrb} />
        <Text style={styles.greeting}>{timeGreeting()}</Text>
        <Text testID="home-screen-title" style={styles.heroTitle}>
          Home
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + space.xl * 2 }]}
        showsVerticalScrollIndicator={false}
      >
        {demoMode && (
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerText}>Demo mode — answers stay on this device only.</Text>
          </View>
        )}
        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: space.lg }} />
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.dailyRow}>
                <View style={styles.dailyIcon}>
                  <Text style={styles.dailyIconGlyph}>✦</Text>
                </View>
                <View style={styles.dailyTitles}>
                  <Text style={styles.kicker}>Daily question</Text>
                  <Text style={styles.cardTitle}>Today&apos;s question</Text>
                </View>
              </View>
              <Text style={styles.cardBody}>One short question, about thirty seconds.</Text>
              <PrimaryButton label="Answer now" onPress={() => router.push('/question/today')} />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Your invite</Text>
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
              <View style={styles.codePanel}>
                <LinearGradient
                  colors={[...gradients.codePanel]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.codeOrb} />
                <Text style={styles.codeLabel}>Your code</Text>
                <Text style={styles.code}>{code ?? '—'}</Text>
              </View>
              <View style={styles.row}>
                <Pressable
                  style={[styles.copyBtn, shadows.sm]}
                  onPress={() => void copyCode()}
                  accessibilityRole="button"
                >
                  <Text style={styles.copyBtnText}>Copy code</Text>
                </Pressable>
                <Pressable
                  style={styles.shareBtn}
                  onPress={() => void shareOut()}
                  accessibilityRole="button"
                >
                  <Text style={styles.shareBtnText}>Share link</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.connectionsHeader}>
                <Text style={styles.cardTitle}>Connections</Text>
                {!demoMode ? (
                  <Link href="/connection/add" asChild>
                    <Pressable accessibilityRole="button">
                      <Text style={styles.link}>Add</Text>
                    </Pressable>
                  </Link>
                ) : null}
              </View>
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
    </View>
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
  const initial = name.trim().slice(0, 1).toUpperCase() || '?';

  return (
    <Pressable
      style={({ pressed }) => [styles.connRow, pressed && styles.connRowPressed]}
      onPress={() => {
        hapticLight();
        onOpen();
      }}
      accessibilityRole="button"
    >
      <LinearGradient
        colors={[...gradients.avatar]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.connAvatar}
      >
        <Text style={styles.connAvatarText}>{initial}</Text>
      </LinearGradient>
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
  screenRoot: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  hero: {
    paddingHorizontal: space.lg,
    paddingBottom: space.lg + 8,
    position: 'relative',
    overflow: 'hidden',
  },
  heroOrb: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(124,58,237,0.2)',
  },
  greeting: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: font.small,
    fontWeight: '500',
    color: colors.accentLight,
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: fontFamily.heading,
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  scroll: {
    flex: 1,
  },
  container: { padding: space.lg, gap: space.md, paddingTop: space.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    gap: space.sm,
    ...shadows.md,
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: 4,
  },
  dailyIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyIconGlyph: {
    fontSize: 18,
    color: colors.accent,
  },
  dailyTitles: {
    flex: 1,
  },
  kicker: {
    fontFamily: fontFamily.bodySemi,
    fontSize: font.caption,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  cardTitle: {
    fontFamily: fontFamily.bodySemi,
    fontSize: font.small,
    fontWeight: '700',
    color: colors.text,
  },
  cardBody: {
    fontFamily: fontFamily.body,
    fontSize: font.small,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.textMid,
  },
  relRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  codePanel: {
    marginTop: space.sm,
    borderRadius: radius.md,
    paddingVertical: space.lg,
    paddingHorizontal: space.md,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  codeOrb: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(124,58,237,0.3)',
  },
  codeLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
    zIndex: 1,
  },
  code: {
    fontFamily: fontFamily.heading,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 4,
    color: '#fff',
    textAlign: 'center',
    zIndex: 1,
  },
  row: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  copyBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBtnText: {
    fontFamily: fontFamily.bodySemi,
    fontWeight: '600',
    color: colors.text,
    fontSize: font.small,
  },
  shareBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: {
    fontFamily: fontFamily.bodySemi,
    fontWeight: '700',
    color: colors.accent,
    fontSize: font.small,
  },
  connectionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
    gap: 12,
    paddingVertical: 12,
    marginTop: 4,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    paddingHorizontal: 12,
  },
  connRowPressed: {
    opacity: 0.92,
  },
  connAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connAvatarText: {
    fontFamily: fontFamily.heading,
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  connText: { flex: 1 },
  connName: {
    fontFamily: fontFamily.bodySemi,
    fontSize: font.small,
    fontWeight: '700',
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
