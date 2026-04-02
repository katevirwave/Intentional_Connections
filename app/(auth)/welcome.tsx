import { useAppStore } from '@/lib/store';
import { colors, font, fontFamily, radius, shadows, space } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export default function WelcomeScreen() {
  const enterDemoMode = useAppStore((s) => s.enterDemoMode);
  const insets = useSafeAreaInsets();

  function onTryDemo() {
    enterDemoMode();
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[colors.accent, colors.accentDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + space.xl }]}
      >
        <Animated.View entering={FadeIn.duration(520)} style={styles.heroInner}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoNum}>100</Text>
          </View>
          <Text style={styles.tag}>Intentional Connections</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(120).duration(480)} style={styles.headlineWrap}>
          <Text testID="welcome-tagline" style={styles.headline}>
            Understand the people in your life.
          </Text>
        </Animated.View>
      </LinearGradient>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.lg }]}>
        <View style={styles.actions}>
          <Link href="/(auth)/sign-up" asChild>
            <Pressable style={[styles.primary, shadows.sm]} accessibilityRole="button">
              <Text style={styles.primaryText}>Create account</Text>
            </Pressable>
          </Link>
          <Link href="/(auth)/log-in" asChild>
            <Pressable style={styles.secondary} accessibilityRole="button">
              <Text style={styles.secondaryText}>Log in</Text>
            </Pressable>
          </Link>
          <Pressable
            testID="welcome-demo"
            style={styles.tertiary}
            onPress={onTryDemo}
            accessibilityRole="button"
            accessibilityLabel="Try demo without logging in"
          >
            <Text style={styles.tertiaryText}>Try demo</Text>
            <Text style={styles.tertiaryHint}>Explore without an account. Nothing is saved to the cloud.</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  hero: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xl * 1.5,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  heroInner: {
    gap: space.md,
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  logoNum: {
    fontFamily: fontFamily.heading,
    fontSize: font.hero,
    fontWeight: '700',
    color: '#fff',
  },
  tag: {
    fontFamily: fontFamily.bodySemi,
    fontSize: font.caption,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headlineWrap: {
    marginTop: space.lg,
  },
  headline: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '600',
    color: '#fff',
  },
  bottom: {
    flex: 1,
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
    backgroundColor: colors.bg,
  },
  actions: {
    gap: space.sm,
  },
  primary: {
    backgroundColor: colors.accent,
    paddingVertical: space.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryText: {
    fontFamily: fontFamily.bodySemi,
    color: '#fff',
    fontSize: font.body,
    fontWeight: '600',
  },
  secondary: {
    paddingVertical: space.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryText: {
    fontFamily: fontFamily.bodySemi,
    color: colors.text,
    fontSize: font.body,
    fontWeight: '600',
  },
  tertiary: {
    marginTop: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    alignItems: 'center',
    gap: space.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  tertiaryText: {
    fontFamily: fontFamily.bodySemi,
    color: colors.accent,
    fontSize: font.body,
    fontWeight: '600',
  },
  tertiaryHint: {
    fontFamily: fontFamily.body,
    color: colors.textMuted,
    fontSize: font.caption,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: space.sm,
  },
});
