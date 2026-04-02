import { cardPrimary, colors, font, fontFamily, space } from '@/lib/theme';
import { scoreBandLabel } from '@/lib/scoring';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 152;
const STROKE = 11;
const R = SIZE / 2 - STROKE / 2;
const CENTER = SIZE / 2;
const CIRC = 2 * Math.PI * R;

type Props = {
  name: string;
  overall: number | null;
  sharedCount: number;
  subline?: string;
};

function ScoreRing({ value }: { value: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.min(1, Math.max(0, value / 100)), {
      duration: 1100,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRC * (1 - progress.value),
  }));

  return (
    <View style={ringStyles.wrap}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Defs>
          <SvgGradient id="scoreRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.accent} />
            <Stop offset="100%" stopColor={colors.accentDark} />
          </SvgGradient>
        </Defs>
        <G transform={`rotate(-90 ${CENTER} ${CENTER})`}>
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={R}
            stroke={colors.border}
            strokeWidth={STROKE}
            fill="none"
          />
          <AnimatedCircle
            cx={CENTER}
            cy={CENTER}
            r={R}
            stroke="url(#scoreRingGrad)"
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${CIRC} ${CIRC}`}
            animatedProps={animatedProps}
          />
        </G>
      </Svg>
      <View style={ringStyles.labelCenter} pointerEvents="none">
        <Text style={ringStyles.scoreLine}>
          <Text style={ringStyles.scoreNum}>{Math.round(value)}</Text>
          <Text style={ringStyles.scoreSlash}>/100</Text>
        </Text>
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignSelf: 'center',
    marginVertical: space.sm,
  },
  labelCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreLine: {
    textAlign: 'center',
  },
  scoreNum: {
    fontFamily: fontFamily.heading,
    fontSize: 36,
    fontWeight: '700',
    color: colors.accent,
  },
  scoreSlash: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: font.small,
    fontWeight: '500',
    color: colors.textMuted,
  },
});

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
          <ScoreRing value={overall} />
          <Text style={styles.band}>{scoreBandLabel(overall)}</Text>
        </>
      )}
      <Text style={styles.meta}>{subline ?? `Based on ${sharedCount} shared answers`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardPrimary,
    alignItems: 'center',
    gap: space.sm,
  },
  name: {
    fontFamily: fontFamily.heading,
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
  placeholder: {
    fontFamily: fontFamily.body,
    fontSize: font.body,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.textMuted,
    textAlign: 'center',
  },
  band: {
    fontFamily: fontFamily.body,
    fontSize: font.small,
    fontWeight: '400',
    color: colors.textMuted,
    textAlign: 'center',
  },
  meta: {
    marginTop: space.sm,
    fontFamily: fontFamily.body,
    fontSize: font.caption,
    fontWeight: '400',
    color: colors.textMuted,
    textAlign: 'center',
  },
});
