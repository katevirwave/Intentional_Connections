import { InsightCard } from '@/components/InsightCard';
import { QuestionCard } from '@/components/QuestionCard';
import {
  fetchMyResponses,
  fetchQuestions,
  getNextQuestionForUser,
  submitLikertResponse,
  submitTextResponse,
} from '@/lib/api';
import { getSelfInsight } from '@/lib/questions';
import { supabase } from '@/lib/supabase';
import { colors, font, radius, space } from '@/lib/theme';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Phase = 'load' | 'question' | 'insight' | 'done_today';

export default function TodayQuestionScreen() {
  const [phase, setPhase] = useState<Phase>('load');
  const [question, setQuestion] = useState<Awaited<ReturnType<typeof fetchQuestions>>[number] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/(auth)/welcome');
        return;
      }
      const [questions, responses] = await Promise.all([fetchQuestions(), fetchMyResponses(user.id)]);
      const next = await getNextQuestionForUser(user.id, questions, responses);
      if (!next) {
        setPhase('done_today');
        return;
      }
      setQuestion(next);
      setPhase('question');
    })();
  }, []);

  async function onSubmitLikert() {
    if (!question || selected === null) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setSubmitting(true);
    try {
      await submitLikertResponse(user.id, question.id, selected);
      setPhase('insight');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmitText() {
    if (!question) return;
    const t = textAnswer.trim();
    if (t.length < 1) {
      Alert.alert('Answer', 'Please write something.');
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setSubmitting(true);
    try {
      await submitTextResponse(user.id, question.id, t);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === 'load' || !question) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Today' }} />
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (phase === 'done_today') {
    return (
      <View style={styles.centerPad}>
        <Stack.Screen options={{ title: 'Today' }} />
        <Text style={styles.doneTitle}>You are set for today</Text>
        <Text style={styles.doneBody}>Come back tomorrow for the next question.</Text>
        <Pressable style={styles.btn} onPress={() => router.replace('/(tabs)')} accessibilityRole="button">
          <Text style={styles.btnText}>Back home</Text>
        </Pressable>
      </View>
    );
  }

  const isIndividual = question.match_type === 'I';

  if (phase === 'insight' && selected !== null) {
    return (
      <ScrollView contentContainerStyle={styles.pad}>
        <Stack.Screen options={{ title: 'Insight' }} />
        <InsightCard answer={selected} insight={getSelfInsight(question.id, selected)} />
        <Pressable style={styles.btn} onPress={() => router.replace('/(tabs)')} accessibilityRole="button">
          <Text style={styles.btnText}>That&apos;s me</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Stack.Screen options={{ title: 'Today' }} />
      {isIndividual ? (
        <>
          <Text style={styles.prompt}>{question.question}</Text>
          <TextInput
            style={styles.textArea}
            multiline
            value={textAnswer}
            onChangeText={setTextAnswer}
            placeholder="Share as much as you like…"
            placeholderTextColor={colors.textMuted}
          />
          <Pressable
            style={[styles.btn, submitting && styles.btnDisabled]}
            onPress={() => void onSubmitText()}
            disabled={submitting}
            accessibilityRole="button"
          >
            <Text style={styles.btnText}>{submitting ? 'Saving…' : 'Submit answer'}</Text>
          </Pressable>
        </>
      ) : (
        <>
          <QuestionCard question={question.question} selected={selected} onSelect={setSelected} disabled={submitting} />
          <Pressable
            style={[styles.btn, (selected === null || submitting) && styles.btnDisabled]}
            onPress={() => void onSubmitLikert()}
            disabled={selected === null || submitting}
            accessibilityRole="button"
          >
            <Text style={styles.btnText}>{submitting ? 'Saving…' : 'Submit answer'}</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  centerPad: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
    padding: space.lg,
    gap: space.md,
  },
  pad: { padding: space.lg, gap: space.md, backgroundColor: colors.bg },
  prompt: {
    fontSize: font.body,
    lineHeight: 24,
    fontWeight: '500',
    color: colors.text,
  },
  textArea: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
    fontSize: font.body,
    backgroundColor: colors.surface,
    color: colors.text,
    textAlignVertical: 'top',
  },
  btn: {
    backgroundColor: colors.accent,
    paddingVertical: space.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: font.body },
  doneTitle: { fontSize: font.title, fontWeight: '700', color: colors.text, textAlign: 'center' },
  doneBody: { fontSize: font.body, color: colors.textMuted, textAlign: 'center' },
});
