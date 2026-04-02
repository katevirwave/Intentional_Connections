import { PrimaryButton } from '@/components/PrimaryButton';
import { useAppStore } from '@/lib/store';
import { colors, font, fontFamily, gradients, radius, space } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
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
        colors={[...gradients.hero]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.35, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 40 }]}
      >
        <View style={styles.orbTop} />
        <View style={styles.orbBottom} />

        <Animated.View entering={FadeIn.duration(520)} style={styles.heroInner}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoNum}>100</Text>
          </View>
          <Text style={styles.tag}>Intentional Connections</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(120).duration(480)} style={styles.headlineWrap}>
          <Text testID="welcome-tagline" style={styles.headline}>
            Understand{'\n'}the people{'\n'}in your life.
          </Text>
        </Animated.View>
        <Text style={styles.heroSub}>
          One question a day. Real answers.{'\n'}A score that actually means something.
        </Text>
      </LinearGradient>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.lg }]}>
        <View style={styles.actions}>
          <PrimaryButton
            label="Create account"
            testID="welcome-sign-up"
            onPress={() => router.push('/(auth)/sign-up')}
          />
          <Pressable
            testID="welcome-log-in"
            style={styles.secondary}
            onPress={() => router.push('/(auth)/log-in')}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryText}>Log in</Text>
          </Pressable>
          <Pressable
            testID="welcome-demo"
            style={styles.demoLinkWrap}
            onPress={onTryDemo}
            accessibilityRole="button"
            accessibilityLabel="Try demo without logging in"
          >
            <Text style={styles.demoLink}>Try demo — no account needed</Text>
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
    flex: 1,
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  orbTop: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(124,58,237,0.15)',
  },
  orbBottom: {
    position: 'absolute',
    bottom: 24,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(124,58,237,0.1)',
  },
  heroInner: {
    gap: space.md,
    zIndex: 1,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  logoNum: {
    fontFamily: fontFamily.heading,
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  tag: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    fontWeight: '600',
    color: colors.accentLight,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  headlineWrap: {
    marginTop: space.lg,
    zIndex: 1,
  },
  headline: {
    fontFamily: fontFamily.heading,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  heroSub: {
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.5)',
    zIndex: 1,
  },
  bottom: {
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
    paddingBottom: space.md,
    backgroundColor: colors.bg,
  },
  actions: {
    gap: 12,
  },
  secondary: {
    paddingVertical: 17,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryText: {
    fontFamily: fontFamily.bodySemi,
    color: colors.text,
    fontSize: font.body,
    fontWeight: '600',
  },
  demoLinkWrap: {
    marginTop: space.sm,
    alignItems: 'center',
    paddingVertical: space.sm,
  },
  demoLink: {
    fontFamily: fontFamily.bodySemi,
    color: colors.accent,
    fontSize: font.small,
    fontWeight: '600',
    borderBottomWidth: 1.5,
    borderBottomColor: colors.accentLight,
    borderStyle: 'dashed',
    paddingBottom: 2,
  },
});
