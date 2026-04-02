import { colors, font, space } from '@/lib/theme';
import type { Dimension } from '@/lib/types';
import { StyleSheet, Text, View } from 'react-native';

const DIM_LABEL: Record<Dimension, string> = {
  values: 'Values',
  communication: 'Comms',
  emotional: 'Emotional',
  lifestyle: 'Lifestyle',
  individual: 'Individual',
};

type Props = {
  dimension: Dimension;
  score: number | null;
  unlockNeed: number;
};

export function DimensionBar({ dimension, score, unlockNeed }: Props) {
  const locked = score === null;
  const widthPct = locked ? 0 : Math.min(100, Math.max(0, score));
  return (
    <View style={styles.row}>
      <Text style={styles.dim}>{DIM_LABEL[dimension]}</Text>
      <View style={styles.track}>
        {!locked && <View style={[styles.fill, { width: `${widthPct}%` }]} />}
      </View>
      <Text style={styles.val}>
        {locked ? `(${unlockNeed} more)` : `${Math.round(score)}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: space.sm,
  },
  dim: {
    width: 88,
    fontSize: font.small,
    color: colors.text,
    fontWeight: '500',
  },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 6,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 6,
  },
  val: {
    width: 72,
    textAlign: 'right',
    fontSize: font.caption,
    color: colors.textMuted,
  },
});
