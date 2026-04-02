import {
  fetchConnectionById,
  fetchMyResponses,
  fetchPartnerResponses,
  fetchQuestions,
  myRelationshipToward,
  otherUserId,
} from '@/lib/api';
import { tendencyLine } from '@/lib/questions';
import { computeMeaningfulGaps } from '@/lib/scoring';
import { useDemoGuardRedirectToTabs } from '@/hooks/useDemoGuard';
import { supabase } from '@/lib/supabase';
import { colors, font, radius, space } from '@/lib/theme';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function DifferentScreen() {
  useDemoGuardRedirectToTabs();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [gaps, setGaps] = useState<ReturnType<typeof computeMeaningfulGaps>>([]);

  const load = useCallback(async () => {
    if (!id) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setLoading(true);
    try {
      const c = await fetchConnectionById(String(id));
      if (!c || c.status !== 'active') {
        setGaps([]);
        return;
      }
      const o = otherUserId(c, user.id);
      const myRel = myRelationshipToward(c, user.id);
      const [questions, mine, partnerRows] = await Promise.all([
        fetchQuestions(),
        fetchMyResponses(user.id),
        fetchPartnerResponses(o),
      ]);
      const partnerAnswers = partnerRows.map((r) => ({ question_id: r.question_id, answer: r.answer }));
      setGaps(computeMeaningfulGaps(mine, partnerAnswers, questions, myRel));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: "What's different" }} />
      <Text style={styles.intro}>
        Meaningful gaps on what you&apos;ve both answered so far. Neither is wrong — this is just worth knowing.
      </Text>
      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: space.lg }} />
      ) : gaps.length === 0 ? (
        <Text style={styles.muted}>No large gaps yet on shared questions.</Text>
      ) : (
        gaps.map((g) => (
          <View key={g.questionId} style={styles.card}>
            <Text style={styles.q}>{g.question}</Text>
            <Text style={styles.row}>
              You: {g.you} · Them: {g.them}
            </Text>
            <Text style={styles.body}>{tendencyLine(g.questionId, 'them', g.them)}</Text>
            <Text style={styles.body}>{tendencyLine(g.questionId, 'you', g.you)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.md, backgroundColor: colors.bg, paddingBottom: space.xl * 2 },
  intro: { fontSize: font.small, lineHeight: 20, color: colors.textMuted },
  muted: { fontSize: font.body, color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.sm,
  },
  q: { fontSize: font.body, fontWeight: '600', color: colors.text },
  row: { fontSize: font.small, color: colors.textMuted },
  body: { fontSize: font.body, lineHeight: 22, color: colors.text },
});
