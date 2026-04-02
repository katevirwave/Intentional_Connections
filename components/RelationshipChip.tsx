import { hapticSelect } from '@/lib/haptics';
import { colors, font, fontFamily, gradients, space } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
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

  if (selected) {
    return (
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityState={{ selected: true }}
        onPress={() => {
          hapticSelect();
          onPress();
        }}
        onPressIn={() => {
          scale.value = withSpring(0.94, { damping: 14, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1.03, { damping: 12, stiffness: 220 });
        }}
        style={[styles.chipSelectedOuter, animatedStyle]}
      >
        <LinearGradient
          colors={[...gradients.primaryCta]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.textOnGradient}>{label}</Text>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected: false }}
      onPress={() => {
        hapticSelect();
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.94, { damping: 14, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 220 });
      }}
      style={[styles.chip, animatedStyle]}
    >
      <Text style={styles.text}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: space.xs + 2,
    paddingHorizontal: space.sm + 4,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelectedOuter: {
    paddingVertical: space.xs + 2,
    paddingHorizontal: space.sm + 4,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: font.caption,
    fontWeight: '500',
    color: colors.textMid,
  },
  textOnGradient: {
    fontFamily: fontFamily.bodySemi,
    fontSize: font.caption,
    fontWeight: '700',
    color: '#fff',
  },
});
