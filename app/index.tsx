import { fetchProfile } from '@/lib/api';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import { type Href, useRootNavigationState, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const router = useRouter();
  const rootNav = useRootNavigationState();
  const [target, setTarget] = useState<Href | null>(null);

  useEffect(() => {
    void (async () => {
      if (useAppStore.getState().demoMode) {
        setTarget('/(tabs)');
        return;
      }
      if (!isSupabaseConfigured()) {
        setTarget('/setup');
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setTarget('/(auth)/welcome');
        return;
      }
      const profile = await fetchProfile(session.user.id);
      if (!profile?.first_name?.trim()) {
        setTarget('/onboarding/name-dob');
        return;
      }
      setTarget('/(tabs)');
    })();
  }, []);

  useEffect(() => {
    if (!rootNav?.key || !target) {
      return;
    }
    router.replace(target);
  }, [rootNav?.key, target, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}
