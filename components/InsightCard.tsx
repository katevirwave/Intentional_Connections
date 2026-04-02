import { cardPrimary, colors, font, fontFamily, radius, space } from '@/lib/theme';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  answer: number;
  insight: string;
};

export function InsightCard({ answer, insight }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.accentBar} />
      <View style={styles.inner}>
        <Text style={styles.label}>Your answer: {answer}</Text>
        <Text style={styles.body}>{insight}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardPrimary,
    padding: 0,
    gap: 0,
  },
  accentBar: {
    height: 4,
    width: '100%',
    backgroundColor: colors.accent,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  inner: {
    padding: space.lg,
    gap: space.sm,
  },
  label: {
    fontFamily: fontFamily.bodySemi,
    fontSize: font.small,
    fontWeight: '600',
    color: colors.textMuted,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: font.body,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.text,
  },
});
