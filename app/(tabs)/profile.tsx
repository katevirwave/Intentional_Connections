import { PrimaryButton } from '@/components/PrimaryButton';
import { fetchMyResponses, fetchProfile, fetchQuestions } from '@/lib/api';
import { ageFromBirthDate } from '@/lib/age';
import { DEMO_QUESTIONS } from '@/lib/demoData';
import { hapticLight } from '@/lib/haptics';
import { getSelfInsight, QUESTION_SHORT_LABELS } from '@/lib/questions';
import { useAppStore } from '@/lib/store';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { colors, font, fontFamily, gradients, radius, shadows, space } from '@/lib/theme';
import { useSession } from '@/hooks/useSession';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function initialsFromName(name: string): string {
  const t = name.trim();
  if (!t) return '?';
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return t.slice(0, 2).toUpperCase();
}

export default function SelfProfileScreen() {
  const insets = useSafeAreaInsets();
  const session = useSession();
  const demoMode = useAppStore((s) => s.demoMode);
  const demoResponses = useAppStore((s) => s.demoResponses);
  const exitDemoMode = useAppStore((s) => s.exitDemoMode);
  const userId = session?.user?.id;
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [lines, setLines] = useState<{ id: string; label: string; body: string }[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(25);

  const avatarLetters = useMemo(() => initialsFromName(name), [name]);
  const answeredCount = lines.length;
  const progressPct = totalQuestions > 0 ? Math.min(100, Math.round((answeredCount / totalQuestions) * 100)) : 0;

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      if (demoMode) {
        setName('Jamie');
        setAge(28);
        setTotalQuestions(DEMO_QUESTIONS.length);
        const questions = DEMO_QUESTIONS;
        const qmap = new Map(questions.map((q) => [q.id, q]));
        const next: { id: string; label: string; body: string }[] = [];
        for (const r of demoResponses) {
          const q = qmap.get(r.question_id);
          if (!q) continue;
          const label = QUESTION_SHORT_LABELS[r.question_id] ?? r.question_id;
          if (q.match_type === 'S' && r.answer != null) {
            next.push({ id: r.question_id, label, body: getSelfInsight(r.question_id, r.answer) });
          } else if (q.match_type === 'I' && r.answer_text) {
            next.push({ id: r.question_id, label, body: r.answer_text });
          }
        }
        next.sort((a, b) => a.id.localeCompare(b.id));
        setLines(next);
        return;
      }
      const [profile, questions, responses] = await Promise.all([
        fetchProfile(userId),
        fetchQuestions(),
        fetchMyResponses(userId),
      ]);
      setName(profile?.first_name ?? '');
      setAge(profile?.birth_date ? ageFromBirthDate(profile.birth_date) : null);
      setTotalQuestions(Math.max(questions.length, 1));
      const qmap = new Map(questions.map((q) => [q.id, q]));
      const next: { id: string; label: string; body: string }[] = [];
      for (const r of responses) {
        const q = qmap.get(r.question_id);
        if (!q) continue;
        const label = QUESTION_SHORT_LABELS[r.question_id] ?? r.question_id;
        if (q.match_type === 'S' && r.answer != null) {
          next.push({ id: r.question_id, label, body: getSelfInsight(r.question_id, r.answer) });
        } else if (q.match_type === 'I' && r.answer_text) {
          next.push({ id: r.question_id, label, body: r.answer_text });
        }
      }
      next.sort((a, b) => a.id.localeCompare(b.id));
      setLines(next);
    } finally {
      setLoading(false);
    }
  }, [userId, demoMode, demoResponses]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function signOut() {
    if (demoMode) {
      exitDemoMode();
      router.replace(isSupabaseConfigured() ? '/(auth)/welcome' : '/setup');
      return;
    }
    await supabase.auth.signOut();
    router.replace('/(auth)/welcome');
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
        <View style={styles.headerRow}>
          <LinearGradient
            colors={[...gradients.avatar]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{avatarLetters}</Text>
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={styles.title}>{name || 'You'}</Text>
            {demoMode && (
              <Text style={styles.demoNote}>Demo profile — not saved to your Supabase project.</Text>
            )}
            {age !== null && (
              <Text style={styles.sub}>Age shown to connections: {age}</Text>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + space.xl * 2 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Your profile</Text>
            <Text style={styles.progressCount}>
              {answeredCount} / {totalQuestions} answered
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={[colors.accent, colors.accentLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progressPct}%` }]}
            />
          </View>
          <Text style={styles.progressHint}>Answer more questions to reveal your full profile</Text>
        </View>

        <Text style={styles.sectionKicker}>Your answers</Text>
        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: space.lg }} />
        ) : lines.length === 0 ? (
          <Text style={styles.muted}>Answer more questions to reveal more of your profile.</Text>
        ) : (
          lines.map((l, i) => (
            <Animated.View key={l.id} entering={FadeIn.delay(i * 72).duration(380)}>
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.cardTopLeft}>
                    <Text style={styles.dim}>{l.id}</Text>
                    <Text style={styles.cardTitle}>{l.label}</Text>
                  </View>
                </View>
                <View style={styles.cardDivider} />
                <Text style={styles.cardBody}>{l.body}</Text>
              </View>
            </Animated.View>
          ))
        )}

        <PrimaryButton label="Answer more questions" onPress={() => router.push('/question/today')} />
        <Pressable
          style={styles.outlineBtn}
          onPress={() => {
            hapticLight();
            void signOut();
          }}
          accessibilityRole="button"
        >
          <Text style={styles.outlineBtnText}>{demoMode ? 'Exit demo' : 'Log out'}</Text>
        </Pressable>
      </ScrollView>
    </View>
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
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(124,58,237,0.2)',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { padding: space.lg, gap: space.md, paddingTop: space.md },
  headerRow: { flexDirection: 'row', gap: space.md, alignItems: 'center', zIndex: 1 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.cta,
  },
  avatarText: {
    fontFamily: fontFamily.heading,
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  headerText: { flex: 1, gap: 4 },
  title: {
    fontFamily: fontFamily.heading,
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: fontFamily.body,
    fontSize: font.small,
    fontWeight: '400',
    color: colors.accentLight,
  },
  demoNote: {
    fontFamily: fontFamily.body,
    fontSize: font.caption,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...shadows.sm,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: font.small,
    fontWeight: '600',
    color: colors.textMid,
  },
  progressCount: {
    fontFamily: fontFamily.bodySemi,
    fontSize: font.small,
    fontWeight: '700',
    color: colors.accent,
  },
  progressTrack: {
    height: 6,
    borderRadius: 99,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
  },
  progressHint: {
    fontFamily: fontFamily.body,
    fontSize: font.caption,
    color: colors.textMuted,
    marginTop: 8,
  },
  sectionKicker: {
    fontFamily: fontFamily.bodySemi,
    fontSize: font.caption,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 4,
  },
  muted: {
    fontFamily: fontFamily.body,
    fontSize: font.small,
    fontWeight: '400',
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    marginBottom: space.sm,
    ...shadows.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTopLeft: { flex: 1 },
  dim: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 2,
  },
  cardTitle: {
    fontFamily: fontFamily.bodySemi,
    fontSize: font.small,
    fontWeight: '700',
    color: colors.text,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  cardBody: {
    fontFamily: fontFamily.body,
    fontSize: font.small,
    fontWeight: '400',
    lineHeight: 22,
    color: colors.textMid,
  },
  outlineBtn: {
    paddingVertical: space.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  outlineBtnText: {
    fontFamily: fontFamily.bodySemi,
    color: colors.text,
    fontWeight: '600',
    fontSize: font.body,
  },
});
