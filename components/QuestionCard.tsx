import { hapticLight } from '@/lib/haptics';
import { cardPrimary, colors, font, fontFamily, radius, space } from '@/lib/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type Props = {
  question: string;
  selected: number | null;
  onSelect: (v: number) => void;
  disabled?: boolean;
};

const labels = ['1', '2', '3', '4', '5'];

function ScalePill({
  v,
  active,
  disabled,
  onSelect,
}: {
  v: number;
  active: boolean;
  disabled?: boolean;
  onSelect: (v: number) => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.pillWrap, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: active, disabled }}
        disabled={disabled}
        onPress={() => {
          hapticLight();
          onSelect(v);
        }}
        onPressIn={() => {
          scale.value = withSpring(0.92, { damping: 16, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 12, stiffness: 280 });
        }}
        style={[styles.pill, active && styles.pillActive, disabled && styles.pillDisabled]}
      >
        <Text style={[styles.pillText, active && styles.pillTextActive]}>{v}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function QuestionCard({ question, selected, onSelect, disabled }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.prompt}>{question}</Text>
      <View style={styles.scaleRow}>
        <Text style={styles.scaleHint}>Never</Text>
        <Text style={styles.scaleHint}>Always</Text>
      </View>
      <View style={styles.row}>
        {labels.map((_, i) => {
          const v = i + 1;
          return (
            <ScalePill key={v} v={v} active={selected === v} disabled={disabled} onSelect={onSelect} />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardPrimary,
    gap: space.md,
  },
  prompt: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: font.body,
    lineHeight: 24,
    color: colors.text,
    fontWeight: '500',
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleHint: {
    fontFamily: fontFamily.body,
    fontSize: font.caption,
    fontWeight: '400',
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  pillWrap: {
    flex: 1,
    maxWidth: 56,
    alignItems: 'center',
  },
  pill: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
    borderWidth: 2,
  },
  pillDisabled: {
    opacity: 0.45,
  },
  pillText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: font.body,
    fontWeight: '600',
    color: colors.text,
  },
  pillTextActive: {
    color: colors.accent,
  },
});
