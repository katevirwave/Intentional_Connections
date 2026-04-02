import { fetchProfile } from '@/lib/api';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import { Redirect, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const [ready, setReady] = useState(false);
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      if (useAppStore.getState().demoMode) {
        setHref('/(tabs)');
        setReady(true);
        return;
      }
      if (!isSupabaseConfigured()) {
        setHref('/setup');
        setReady(true);
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setHref('/(auth)/welcome');
        setReady(true);
        return;
      }
      const profile = await fetchProfile(session.user.id);
      if (!profile?.first_name?.trim()) {
        setHref('/onboarding/name-dob');
        setReady(true);
        return;
      }
      setHref('/(tabs)');
      setReady(true);
    })();
  }, []);

  if (!ready || !href) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return <Redirect href={href as Href} />;
}
