import { colors, font, radius, space } from '@/lib/theme';
import { scoreBandLabel } from '@/lib/scoring';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  name: string;
  overall: number | null;
  sharedCount: number;
  subline?: string;
};

export function ScoreCard({ name, overall, sharedCount, subline }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{name}</Text>
      <View style={styles.rule} />
      {overall === null ? (
        <Text style={styles.placeholder}>
          You both need to answer a few more questions before your score appears. Come back tomorrow.
        </Text>
      ) : (
        <>
          <Text style={styles.score}>{overall} / 100</Text>
          <Text style={styles.band}>{scoreBandLabel(overall)}</Text>
        </>
      )}
      <Text style={styles.meta}>
        {subline ?? `Based on ${sharedCount} shared answers`}
      </Text>
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
    alignItems: 'center',
    gap: space.sm,
  },
  name: {
    fontSize: font.title,
    fontWeight: '700',
    color: colors.text,
  },
  rule: {
    height: 1,
    width: '100%',
    backgroundColor: colors.border,
    marginVertical: space.xs,
  },
  score: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.accent,
  },
  band: {
    fontSize: font.small,
    color: colors.textMuted,
  },
  placeholder: {
    fontSize: font.body,
    lineHeight: 24,
    color: colors.textMuted,
    textAlign: 'center',
  },
  meta: {
    marginTop: space.sm,
    fontSize: font.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
