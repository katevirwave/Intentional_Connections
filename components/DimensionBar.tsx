import { colors, font, fontFamily, radius, space } from '@/lib/theme';
import type { Dimension } from '@/lib/types';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

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
  const [trackW, setTrackW] = useState(0);
  const targetPx = trackW > 0 ? (trackW * widthPct) / 100 : 0;
  const widthPx = useSharedValue(0);

  useEffect(() => {
    widthPx.value = withTiming(targetPx, {
      duration: 750,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetPx, widthPx]);

  const fillStyle = useAnimatedStyle(() => ({
    width: widthPx.value,
  }));

  function onTrackLayout(e: LayoutChangeEvent) {
    setTrackW(e.nativeEvent.layout.width);
  }

  return (
    <View style={styles.row}>
      <Text style={styles.dim}>{DIM_LABEL[dimension]}</Text>
      <View style={styles.track} onLayout={onTrackLayout}>
        {!locked && trackW > 0 ? (
          <Animated.View style={[styles.fillOuter, fillStyle]}>
            <LinearGradient
              colors={[colors.accent, colors.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.fillGradient}
            />
          </Animated.View>
        ) : null}
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
    fontFamily: fontFamily.bodyMedium,
    fontSize: font.small,
    fontWeight: '500',
    color: colors.text,
  },
  track: {
    flex: 1,
    height: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fillOuter: {
    height: '100%',
    overflow: 'hidden',
    borderRadius: radius.sm,
  },
  fillGradient: {
    width: '100%',
    height: '100%',
    minWidth: 120,
  },
  val: {
    width: 72,
    textAlign: 'right',
    fontFamily: fontFamily.body,
    fontSize: font.caption,
    fontWeight: '400',
    color: colors.textMuted,
  },
});
