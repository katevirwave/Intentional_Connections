import type { TextStyle, ViewStyle } from 'react-native';

/** Aligned with 100 App UI concept — deep purple system */
export const colors = {
  bg: '#F5F3FF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#0F0A1E',
  textMuted: '#6B7280',
  textMid: '#4B5563',
  border: '#E5E7EB',
  accent: '#7C3AED',
  accentDark: '#5B21B6',
  accentLight: '#A78BFA',
  accentMuted: '#EDE9FE',
  accentSoft: '#EDE9FE',
  deepPurple: '#1A0A3B',
  midPurple: '#2D1B69',
  heroPurpleBottom: '#0D0520',
  teal: '#0D9488',
  warn: '#B45309',
};

export const gradients = {
  hero: [colors.midPurple, colors.deepPurple, colors.heroPurpleBottom] as const,
  heroShort: [colors.midPurple, colors.deepPurple] as const,
  primaryCta: [colors.accent, colors.accentDark] as const,
  avatar: [colors.accent, colors.accentDark] as const,
  codePanel: [colors.midPurple, colors.deepPurple] as const,
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  } satisfies ViewStyle,
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  } satisfies ViewStyle,
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  } satisfies ViewStyle,
  cta: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  } satisfies ViewStyle,
};

/** Primary elevated cards: white, soft shadow (concept) */
export const cardPrimary: ViewStyle = {
  backgroundColor: colors.surfaceElevated,
  borderRadius: radius.lg,
  padding: space.lg,
  borderWidth: 1,
  borderColor: 'rgba(0,0,0,0.04)',
  ...shadows.md,
};

/** Secondary / dense lists */
export const cardSecondary: ViewStyle = {
  backgroundColor: colors.surface,
  borderRadius: radius.lg,
  padding: space.lg,
  borderWidth: 1,
  borderColor: 'rgba(0,0,0,0.04)',
  ...shadows.md,
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
