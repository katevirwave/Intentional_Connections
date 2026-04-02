import { InsightCard } from '@/components/InsightCard';
import { PrimaryButton } from '@/components/PrimaryButton';
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
import { colors, font, fontFamily, radius, space } from '@/lib/theme';
import { useSession } from '@/hooks/useSession';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

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
  const [textFocused, setTextFocused] = useState(false);

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
        <Animated.View entering={FadeIn.duration(360)} style={styles.fadeBlock}>
          <Text style={styles.doneTitle}>{demoMode ? 'Demo questions complete' : 'You are set for today'}</Text>
          <Text style={styles.doneBody}>
            {demoMode
              ? 'Create an account to answer daily questions and connect with someone for real.'
              : 'Come back tomorrow for the next question.'}
          </Text>
          <PrimaryButton label="Back home" onPress={() => router.replace('/(tabs)')} />
        </Animated.View>
      </View>
    );
  }

  if (phase === 'insight' && selected !== null && question) {
    return (
      <ScrollView contentContainerStyle={styles.pad}>
        <Stack.Screen options={{ title: 'Insight' }} />
        <Animated.View entering={FadeIn.duration(340)} style={styles.fadeCol}>
          <InsightCard answer={selected} insight={getSelfInsight(question.id, selected)} />
          <PrimaryButton label="That&apos;s me" onPress={() => router.replace('/(tabs)')} />
        </Animated.View>
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
    <ScrollView testID="question-today-screen" contentContainerStyle={styles.pad}>
      <Stack.Screen options={{ title: 'Today' }} />
      <Animated.View entering={FadeIn.duration(320)} style={styles.fadeCol}>
        {demoMode && (
          <Text style={styles.demoHint}>Demo — this answer is stored only on this device.</Text>
        )}
        {isIndividual ? (
          <>
            <Text style={styles.prompt}>{question.question}</Text>
            <TextInput
              style={[styles.textArea, textFocused && styles.textAreaFocused]}
              multiline
              value={textAnswer}
              onChangeText={setTextAnswer}
              onFocus={() => setTextFocused(true)}
              onBlur={() => setTextFocused(false)}
              placeholder="Share as much as you like…"
              placeholderTextColor={colors.textMuted}
            />
            <PrimaryButton
              label={submitting ? 'Saving…' : 'Submit answer'}
              onPress={() => void onSubmitText()}
              disabled={submitting}
            />
          </>
        ) : (
          <>
            <QuestionCard question={question.question} selected={selected} onSelect={setSelected} disabled={submitting} />
            <PrimaryButton
              label={submitting ? 'Saving…' : 'Submit answer'}
              onPress={() => void onSubmitLikert()}
              disabled={selected === null || submitting}
            />
          </>
        )}
      </Animated.View>
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
  fadeBlock: {
    gap: space.md,
    alignItems: 'center',
    width: '100%',
  },
  fadeCol: { gap: space.md },
  pad: { padding: space.lg, gap: space.md, backgroundColor: colors.bg },
  demoHint: {
    fontFamily: fontFamily.body,
    fontSize: font.caption,
    fontWeight: '400',
    color: colors.textMuted,
    lineHeight: 18,
  },
  prompt: {
    fontFamily: fontFamily.bodyMedium,
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
    fontFamily: fontFamily.body,
    backgroundColor: colors.surface,
    color: colors.text,
    textAlignVertical: 'top',
  },
  textAreaFocused: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  doneTitle: {
    fontFamily: fontFamily.heading,
    fontSize: font.title,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  doneBody: {
    fontFamily: fontFamily.body,
    fontSize: font.body,
    fontWeight: '400',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
