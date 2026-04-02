import { PrimaryButton } from '@/components/PrimaryButton';
import { SectionHeader } from '@/components/SectionHeader';
import { fetchMyResponses, fetchProfile, fetchQuestions } from '@/lib/api';
import { ageFromBirthDate } from '@/lib/age';
import { DEMO_QUESTIONS } from '@/lib/demoData';
import { hapticLight } from '@/lib/haptics';
import { getSelfInsight, QUESTION_SHORT_LABELS } from '@/lib/questions';
import { useAppStore } from '@/lib/store';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { cardSecondary, colors, font, fontFamily, radius, space } from '@/lib/theme';
import { useSession } from '@/hooks/useSession';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

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
  const session = useSession();
  const demoMode = useAppStore((s) => s.demoMode);
  const demoResponses = useAppStore((s) => s.demoResponses);
  const exitDemoMode = useAppStore((s) => s.exitDemoMode);
  const userId = session?.user?.id;
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [lines, setLines] = useState<{ id: string; label: string; body: string }[]>([]);

  const avatarLetters = useMemo(() => initialsFromName(name), [name]);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      if (demoMode) {
        setName('Jamie');
        setAge(28);
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
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{avatarLetters}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{name || 'You'}</Text>
          {demoMode && (
            <Text style={styles.demoNote}>Demo profile — not saved to your Supabase project.</Text>
          )}
          {age !== null && <Text style={styles.sub}>Age shown to connections: {age}</Text>}
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <SectionHeader title="Your answers so far" />
        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: space.lg }} />
        ) : lines.length === 0 ? (
          <Text style={styles.muted}>Answer more questions to reveal more of your profile.</Text>
        ) : (
          lines.map((l, i) => (
            <Animated.View key={l.id} entering={FadeIn.delay(i * 72).duration(380)}>
              <View style={styles.card}>
                <Text style={styles.dim}>{l.id}</Text>
                <Text style={styles.cardTitle}>{l.label}</Text>
                <Text style={styles.cardBody}>{l.body}</Text>
              </View>
            </Animated.View>
          ))
        )}
      </View>

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
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  container: { padding: space.lg, gap: space.md, backgroundColor: colors.bg, paddingBottom: space.xl * 2 },
  headerRow: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fontFamily.heading,
    fontSize: font.title,
    fontWeight: '700',
    color: '#fff',
  },
  headerText: { flex: 1, gap: 4 },
  title: {
    fontFamily: fontFamily.heading,
    fontSize: font.display,
    fontWeight: '700',
    color: colors.text,
  },
  sub: {
    fontFamily: fontFamily.body,
    fontSize: font.small,
    fontWeight: '400',
    color: colors.textMuted,
  },
  demoNote: {
    fontFamily: fontFamily.body,
    fontSize: font.caption,
    fontWeight: '400',
    color: colors.textMuted,
    lineHeight: 18,
  },
  sectionBlock: { gap: space.sm, marginTop: space.sm },
  muted: {
    fontFamily: fontFamily.body,
    fontSize: font.small,
    fontWeight: '400',
    color: colors.textMuted,
  },
  card: {
    ...cardSecondary,
    padding: space.md,
    gap: space.xs,
    marginBottom: space.sm,
  },
  dim: {
    fontFamily: fontFamily.body,
    fontSize: font.caption,
    fontWeight: '400',
    color: colors.textMuted,
  },
  cardTitle: {
    fontFamily: fontFamily.bodySemi,
    fontSize: font.small,
    fontWeight: '600',
    color: colors.text,
  },
  cardBody: {
    fontFamily: fontFamily.body,
    fontSize: font.body,
    fontWeight: '400',
    lineHeight: 22,
    color: colors.text,
  },
  outlineBtn: {
    paddingVertical: space.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
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
