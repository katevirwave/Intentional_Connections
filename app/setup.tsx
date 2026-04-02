import { useAppStore } from '@/lib/store';
import { colors, font, fontFamily, radius, shadows, space } from '@/lib/theme';
import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function SetupScreen() {
  const enterDemoMode = useAppStore((s) => s.enterDemoMode);

  function onTryDemo() {
    enterDemoMode();
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Setup' }} />
      <Text testID="setup-missing-supabase" style={styles.title}>
        Supabase is not configured
      </Text>
      <Text style={styles.body}>
        Create a Supabase project, run the SQL in <Text style={styles.mono}>supabase/migrations/</Text>, then add
        <Text style={styles.mono}> EXPO_PUBLIC_SUPABASE_URL</Text> and{' '}
        <Text style={styles.mono}>EXPO_PUBLIC_SUPABASE_ANON_KEY</Text> to a <Text style={styles.mono}>.env</Text> file
        (see <Text style={styles.mono}>.env.example</Text>). Restart Expo.
      </Text>
      <Pressable
        testID="setup-try-demo"
        style={[styles.demoBtn, shadows.sm]}
        onPress={onTryDemo}
        accessibilityRole="button"
        accessibilityLabel="Try demo without Supabase"
      >
        <Text style={styles.demoBtnText}>Try demo anyway</Text>
        <Text style={styles.demoHint}>Browse the UI with local sample data (no backend).</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: space.lg,
    justifyContent: 'center',
    gap: space.md,
  },
  title: {
    fontFamily: fontFamily.heading,
    fontSize: font.title,
    fontWeight: '700',
    color: colors.text,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: font.body,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.textMuted,
  },
  mono: {
    fontFamily: 'Courier',
    color: colors.text,
  },
  demoBtn: {
    marginTop: space.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
    gap: space.xs,
  },
  demoBtnText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: font.body,
    fontWeight: '600',
    color: colors.accent,
    textAlign: 'center',
  },
  demoHint: {
    fontFamily: fontFamily.body,
    fontSize: font.caption,
    fontWeight: '400',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
