import { hapticLight } from '@/lib/haptics';
import { colors, fontFamily, radius, shadows, space } from '@/lib/theme';
import * as React from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: 'filled' | 'outline';
};

export function PrimaryButton({ label, onPress, disabled, style, variant = 'filled' }: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        hapticLight();
        onPress();
      }}
      onPressIn={() => {
        if (disabled) return;
        scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        if (disabled) return;
        scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      }}
      style={[
        styles.base,
        variant === 'filled' ? styles.filled : styles.outline,
        variant === 'filled' && shadows.sm,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      <Text style={[styles.text, variant === 'outline' && styles.textOutline]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: space.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: {
    backgroundColor: colors.accent,
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  textOutline: {
    color: colors.text,
  },
});
