import { fetchMyResponses, fetchProfile, fetchQuestions } from '@/lib/api';
import { ageFromBirthDate } from '@/lib/age';
import { getSelfInsight, QUESTION_SHORT_LABELS } from '@/lib/questions';
import { supabase } from '@/lib/supabase';
import { colors, font, radius, space } from '@/lib/theme';
import { useSession } from '@/hooks/useSession';
import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function SelfProfileScreen() {
  const session = useSession();
  const userId = session?.user?.id;
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [lines, setLines] = useState<{ id: string; label: string; body: string }[]>([]);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
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
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  async function signOut() {
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
      <Text style={styles.title}>{name || 'You'}</Text>
      {age !== null && <Text style={styles.sub}>Age shown to connections: {age}</Text>}
      <Text style={styles.section}>Your answers so far</Text>
      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginVertical: space.lg }} />
      ) : lines.length === 0 ? (
        <Text style={styles.muted}>Answer more questions to reveal more of your profile.</Text>
      ) : (
        lines.map((l) => (
          <View key={l.id} style={styles.card}>
            <Text style={styles.dim}>{l.id}</Text>
            <Text style={styles.cardTitle}>{l.label}</Text>
            <Text style={styles.cardBody}>{l.body}</Text>
          </View>
        ))
      )}
      <Link href="/question/today" asChild>
        <Pressable style={styles.primaryBtn} accessibilityRole="button">
          <Text style={styles.primaryBtnText}>Answer more questions</Text>
        </Pressable>
      </Link>
      <Pressable style={styles.outlineBtn} onPress={() => void signOut()} accessibilityRole="button">
        <Text style={styles.outlineBtnText}>Log out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  container: { padding: space.lg, gap: space.md, backgroundColor: colors.bg, paddingBottom: space.xl * 2 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  sub: { fontSize: font.small, color: colors.textMuted },
  section: { marginTop: space.md, fontSize: font.body, fontWeight: '700', color: colors.text },
  muted: { fontSize: font.small, color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.xs,
  },
  dim: { fontSize: font.caption, color: colors.textMuted },
  cardTitle: { fontSize: font.small, fontWeight: '600', color: colors.text },
  cardBody: { fontSize: font.body, lineHeight: 22, color: colors.text },
  primaryBtn: {
    marginTop: space.md,
    backgroundColor: colors.accent,
    paddingVertical: space.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: font.body },
  outlineBtn: {
    paddingVertical: space.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  outlineBtnText: { color: colors.text, fontWeight: '600', fontSize: font.body },
});
