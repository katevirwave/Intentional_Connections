import { hapticLight } from '@/lib/haptics';
import { colors, fontFamily, gradients, radius, shadows, space } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: 'filled' | 'outline' | 'gradient';
  testID?: string;
};

export function PrimaryButton({ label, onPress, disabled, style, variant = 'filled', testID }: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const useGradient = variant === 'filled' || variant === 'gradient';

  if (useGradient) {
    return (
      <AnimatedPressable
        testID={testID}
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
          styles.gradientOuter,
          shadows.cta,
          disabled && styles.disabled,
          animatedStyle,
          style,
        ]}
      >
        <LinearGradient
          colors={[...gradients.primaryCta]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.text}>{label}</Text>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      testID={testID}
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
        styles.outline,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      <Text style={[styles.text, styles.textOutline]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: space.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gradientOuter: {
    position: 'relative',
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  textOutline: {
    color: colors.text,
    fontWeight: '600',
  },
});
