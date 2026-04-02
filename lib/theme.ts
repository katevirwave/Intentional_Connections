import type { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  bg: '#F7F5F2',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#1C1917',
  textMuted: '#57534E',
  border: '#E7E5E4',
  accent: '#0D9488',
  accentDark: '#0F766E',
  accentMuted: '#CCFBF1',
  warn: '#C2410C',
};

/** Use after fonts load via useFonts (Plus Jakarta Sans / Inter). */
export const fontFamily = {
  heading: 'PlusJakartaSans_700Bold',
  headingSemi: 'PlusJakartaSans_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
} as const;

export const space = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  full: 9999,
};

export const font = {
  hero: 48,
  display: 32,
  title: 22,
  body: 16,
  small: 14,
  caption: 12,
};

/** iOS shadow + Android elevation */
export const shadows = {
  sm: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  } satisfies ViewStyle,
  md: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  } satisfies ViewStyle,
  lg: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  } satisfies ViewStyle,
};

/** Primary elevated cards: shadow, no border */
export const cardPrimary: ViewStyle = {
  backgroundColor: colors.surfaceElevated,
  borderRadius: radius.lg,
  padding: space.lg,
  ...shadows.md,
};

/** Secondary / dense lists: border, no shadow */
export const cardSecondary: ViewStyle = {
  backgroundColor: colors.surface,
  borderRadius: radius.lg,
  padding: space.lg,
  borderWidth: 1,
  borderColor: colors.border,
};

export const textHeading = (size: number, weight: '600' | '700' = '700'): TextStyle => ({
  fontFamily: weight === '700' ? fontFamily.heading : fontFamily.headingSemi,
  fontSize: size,
  fontWeight: weight === '700' ? '700' : '600',
  color: colors.text,
});

export const textBody = (size: number = font.body, weight: '400' | '500' | '600' = '400'): TextStyle => {
  const map = {
    '400': fontFamily.body,
    '500': fontFamily.bodyMedium,
    '600': fontFamily.bodySemi,
  } as const;
  return {
    fontFamily: map[weight],
    fontSize: size,
    fontWeight: weight,
    color: colors.text,
  };
};
