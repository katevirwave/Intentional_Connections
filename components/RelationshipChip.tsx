import { hapticSelect } from '@/lib/haptics';
import { colors, font, fontFamily, radius, space } from '@/lib/theme';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function RelationshipChip({ label, selected, onPress }: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        hapticSelect();
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.94, { damping: 14, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(selected ? 1.03 : 1, { damping: 12, stiffness: 220 });
      }}
      style={[styles.chip, selected && styles.chipOn, animatedStyle]}
    >
      <Text style={[styles.text, selected && styles.textOn]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  chipOn: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  text: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: font.caption,
    fontWeight: '500',
    color: colors.text,
  },
  textOn: {
    fontFamily: fontFamily.bodySemi,
    fontWeight: '600',
    color: colors.accent,
  },
});
