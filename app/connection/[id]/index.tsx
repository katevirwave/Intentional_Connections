import { DimensionBar } from '@/components/DimensionBar';
import { IndividualAnswerCard } from '@/components/IndividualAnswerCard';
import { ScoreCard } from '@/components/ScoreCard';
import {
  fetchAnswerReads,
  fetchConnectionById,
  fetchMyResponses,
  fetchPartnerResponses,
  fetchProfile,
  fetchQuestions,
  markAnswerRead,
  myRelationshipToward,
  otherUserId,
} from '@/lib/api';
import { CONNECTION_UI_LABEL } from '@/lib/questions';
import {
  DIMENSION_UNLOCK_SHARED,
  computeCompatibility,
  dimensionsForRelationship,
} from '@/lib/scoring';
import { supabase } from '@/lib/supabase';
import { colors, font, radius, space } from '@/lib/theme';
import type { Dimension, QuestionRow } from '@/lib/types';
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

export default function ConnectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [overall, setOverall] = useState<number | null>(null);
  const [shared, setShared] = useState(0);
  const [dimScores, setDimScores] = useState<Partial<Record<Dimension, number | null>>>({});
  const [dimCounts, setDimCounts] = useState<Partial<Record<Dimension, number>>>({});
  const [rel, setRel] = useState<ReturnType<typeof myRelationshipToward>>(null);
  const [status, setStatus] = useState<string>('');
  const [ipItems, setIpItems] = useState<{ q: QuestionRow; text: string }[]>([]);
  const [readSet, setReadSet] = useState<Set<string>>(new Set());
  const [me, setMe] = useState<string | null>(null);
  const [other, setOther] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/(auth)/welcome');
      return;
    }
    setMe(user.id);
    setLoading(true);
    try {
      const c = await fetchConnectionById(String(id));
      if (!c) {
        Alert.alert('Missing', 'Connection not found.');
        router.replace('/(tabs)');
        return;
      }
      setStatus(c.status);
      const o = otherUserId(c, user.id);
      setOther(o);
      const p = await fetchProfile(o);
      setName(p?.first_name ?? 'Connection');
      const myRel = myRelationshipToward(c, user.id);
      setRel(myRel);

      if (c.status !== 'active') {
        setOverall(null);
        setShared(0);
        setIpItems([]);
        return;
      }

      const [questions, mine, partnerRows, reads] = await Promise.all([
        fetchQuestions(),
        fetchMyResponses(user.id),
        fetchPartnerResponses(o).catch(() => []),
        fetchAnswerReads(user.id, o),
      ]);
      setReadSet(reads);

      const partnerAnswers = partnerRows.map((r) => ({ question_id: r.question_id, answer: r.answer }));
      const result = computeCompatibility(mine, partnerAnswers, questions, myRel);
      setOverall(result.overall);
      setShared(result.questionsScored);
      setDimScores(result.dimensionScores);
      setDimCounts(result.dimensionCounts);

      const qmap = new Map(questions.map((q) => [q.id, q]));
      const ips: { q: QuestionRow; text: string }[] = [];
      for (const row of partnerRows) {
        const q = qmap.get(row.question_id);
        if (q?.dimension === 'individual' && row.answer_text) ips.push({ q, text: row.answer_text });
      }
      setIpItems(ips);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not load');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const dims = useMemo(() => {
    const allowed = dimensionsForRelationship(rel);
    return allowed.filter((d) => d !== 'individual') as Dimension[];
  }, [rel]);

  async function onMarkRead(qid: string) {
    if (!me || !other) return;
    try {
      await markAnswerRead(me, other, qid);
      setReadSet((prev) => new Set(prev).add(qid));
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not mark read');
    }
  }

  if (loading && !name) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Connection' }} />
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const uiLabel = rel ? CONNECTION_UI_LABEL[rel] : 'Connection';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: name }} />
      <Text style={styles.meta}>
        {name} · {uiLabel}
      </Text>
      {status !== 'active' ? (
        <Text style={styles.muted}>This connection is not active yet.</Text>
      ) : (
        <>
          <ScoreCard name={name} overall={overall} sharedCount={shared} />
          <Text style={styles.section}>Dimensions</Text>
          <Text style={styles.disclaimer}>
            Based on what you&apos;ve both shared so far. Your scores can change as you share more.
          </Text>
          <View style={styles.card}>
            {dims.map((d) => (
              <DimensionBar
                key={d}
                dimension={d}
                score={dimScores[d] ?? null}
                unlockNeed={Math.max(0, DIMENSION_UNLOCK_SHARED - (dimCounts[d] ?? 0))}
              />
            ))}
          </View>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => router.push(`/connection/${String(id)}/different`)}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryBtnText}>See what&apos;s different</Text>
          </Pressable>
          {ipItems.length > 0 && (
            <>
              <Text style={styles.section}>Individual preferences</Text>
              {ipItems.map(({ q, text }) => (
                <IndividualAnswerCard
                  key={q.id}
                  question={q.question}
                  answer={text}
                  read={readSet.has(q.id)}
                  onMarkRead={() => void onMarkRead(q.id)}
                />
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  container: { padding: space.lg, gap: space.md, backgroundColor: colors.bg, paddingBottom: space.xl * 2 },
  meta: { fontSize: font.small, color: colors.textMuted },
  muted: { fontSize: font.body, color: colors.textMuted },
  section: { fontSize: font.body, fontWeight: '700', color: colors.text },
  disclaimer: { fontSize: font.caption, lineHeight: 18, color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtn: {
    paddingVertical: space.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryBtnText: { fontWeight: '600', color: colors.text, fontSize: font.body },
});
