import { InsightCard } from '@/components/InsightCard';
import { QuestionCard } from '@/components/QuestionCard';
import {
  fetchMyResponses,
  fetchQuestions,
  getNextQuestionForUser,
  submitLikertResponse,
  submitTextResponse,
} from '@/lib/api';
import { DEMO_QUESTIONS, getNextDemoQuestion } from '@/lib/demoData';
import { getSelfInsight } from '@/lib/questions';
import { useAppStore } from '@/lib/store';
import { colors, font, radius, space } from '@/lib/theme';
import { useSession } from '@/hooks/useSession';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
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
  const session = useSession();
  const demoMode = useAppStore((s) => s.demoMode);
  const addDemoLikert = useAppStore((s) => s.addDemoLikertResponse);
  const addDemoText = useAppStore((s) => s.addDemoTextResponse);

  const [phase, setPhase] = useState<Phase>('load');
  const [question, setQuestion] = useState<(typeof DEMO_QUESTIONS)[number] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadQuestion = useCallback(async () => {
    if (session === undefined) {
      return;
    }
    if (!session?.user) {
      router.replace('/(auth)/welcome');
      return;
    }
    setPhase('load');
    const userId = session.user.id;
    try {
      const questions = demoMode ? DEMO_QUESTIONS : await fetchQuestions();
      const responses = demoMode ? useAppStore.getState().demoResponses : await fetchMyResponses(userId);
      const next = demoMode
        ? getNextDemoQuestion(questions, responses)
        : await getNextQuestionForUser(userId, questions, responses);
      if (!next) {
        setQuestion(null);
        setPhase('done_today');
        return;
      }
      setQuestion(next);
      setSelected(null);
      setTextAnswer('');
      setPhase('question');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not load question');
      router.replace('/(tabs)');
    }
  }, [session, demoMode]);

  useFocusEffect(
    useCallback(() => {
      void loadQuestion();
    }, [loadQuestion]),
  );

  async function onSubmitLikert() {
    if (!question || selected === null || !session?.user) return;
    const userId = session.user.id;
    setSubmitting(true);
    try {
      if (demoMode) {
        addDemoLikert(question.id, selected);
        setPhase('insight');
        return;
      }
      await submitLikertResponse(userId, question.id, selected);
      setPhase('insight');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmitText() {
    if (!question || !session?.user) return;
    const t = textAnswer.trim();
    if (t.length < 1) {
      Alert.alert('Answer', 'Please write something.');
      return;
    }
    const userId = session.user.id;
    setSubmitting(true);
    try {
      if (demoMode) {
        addDemoText(question.id, t);
        router.replace('/(tabs)');
        return;
      }
      await submitTextResponse(userId, question.id, t);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === 'done_today') {
    return (
      <View style={styles.centerPad}>
        <Stack.Screen options={{ title: 'Today' }} />
        <Text style={styles.doneTitle}>{demoMode ? 'Demo questions complete' : 'You are set for today'}</Text>
        <Text style={styles.doneBody}>
          {demoMode
            ? 'Create an account to answer daily questions and connect with someone for real.'
            : 'Come back tomorrow for the next question.'}
        </Text>
        <Pressable style={styles.btn} onPress={() => router.replace('/(tabs)')} accessibilityRole="button">
          <Text style={styles.btnText}>Back home</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === 'insight' && selected !== null && question) {
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

  if (phase === 'load' || !question) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Today' }} />
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const isIndividual = question.match_type === 'I';

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Stack.Screen options={{ title: 'Today' }} />
      {demoMode && (
        <Text style={styles.demoHint}>Demo — this answer is stored only on this device.</Text>
      )}
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
  demoHint: {
    fontSize: font.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
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
