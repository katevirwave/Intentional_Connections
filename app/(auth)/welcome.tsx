import { colors, font, radius, space } from '@/lib/theme';
import { Link, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function WelcomeScreen() {
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
});
