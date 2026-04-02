import { colors, font, radius, space } from '@/lib/theme';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  answer: number;
  insight: string;
};

export function InsightCard({ answer, insight }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Your answer: {answer}</Text>
      <Text style={styles.body}>{insight}</Text>
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
  label: {
    fontSize: font.small,
    fontWeight: '600',
    color: colors.textMuted,
  },
  body: {
    fontSize: font.body,
    lineHeight: 24,
    color: colors.text,
  },
});
