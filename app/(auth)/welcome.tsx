import { useAppStore } from '@/lib/store';
import { colors, font, radius, space } from '@/lib/theme';
import { Link, router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function WelcomeScreen() {
  const enterDemoMode = useAppStore((s) => s.enterDemoMode);

  function onTryDemo() {
    enterDemoMode();
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={styles.logo}>100</Text>
      <Text style={styles.tag}>Intentional Connections</Text>
      <Text testID="welcome-tagline" style={styles.headline}>
        Understand the people in your life.
      </Text>
      <View style={styles.actions}>
        <Link href="/(auth)/sign-up" asChild>
          <Pressable style={styles.primary} accessibilityRole="button">
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
          <Text style={styles.tertiaryHint}>Explore the app without an account. Nothing is saved to the cloud.</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: space.lg,
    paddingTop: space.xl * 2,
    gap: space.md,
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.accent,
  },
  tag: {
    fontSize: font.caption,
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '600',
    color: colors.text,
    marginTop: space.lg,
  },
  actions: {
    marginTop: space.xl,
    gap: space.sm,
  },
  primary: {
    backgroundColor: colors.accent,
    paddingVertical: space.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryText: {
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
    color: colors.text,
    fontSize: font.body,
    fontWeight: '600',
  },
  tertiary: {
    marginTop: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
    alignItems: 'center',
    gap: space.xs,
  },
  tertiaryText: {
    color: colors.accent,
    fontSize: font.body,
    fontWeight: '600',
  },
  tertiaryHint: {
    color: colors.textMuted,
    fontSize: font.caption,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: space.sm,
  },
});
