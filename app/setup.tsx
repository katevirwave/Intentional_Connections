import { colors, font, space } from '@/lib/theme';
import { Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function SetupScreen() {
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
    fontSize: font.title,
    fontWeight: '700',
    color: colors.text,
  },
  body: {
    fontSize: font.body,
    lineHeight: 24,
    color: colors.textMuted,
  },
  mono: {
    fontFamily: 'Courier',
    color: colors.text,
  },
});
