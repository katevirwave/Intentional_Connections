import { colors, font, radius, space } from '@/lib/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  question: string;
  answer: string;
  read: boolean;
  onMarkRead: () => void;
};

export function IndividualAnswerCard({ question, answer, read, onMarkRead }: Props) {
  return (
    <View style={styles.card}>
      {!read && <View style={styles.dot} />}
      <Text style={styles.q}>{question}</Text>
      <Text style={styles.a}>{answer}</Text>
      <Pressable style={styles.btn} onPress={onMarkRead} accessibilityRole="button">
        <Text style={styles.btnText}>{read ? 'Marked as read' : 'Mark as read'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    alignSelf: 'flex-start',
  },
  q: {
    fontSize: font.small,
    fontWeight: '600',
    color: colors.textMuted,
  },
  a: {
    fontSize: font.body,
    lineHeight: 24,
    color: colors.text,
  },
  btn: {
    alignSelf: 'flex-start',
    marginTop: space.sm,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.accentMuted,
  },
  btnText: {
    fontSize: font.small,
    fontWeight: '600',
    color: colors.accent,
  },
});
