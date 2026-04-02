import { useAppStore } from '@/lib/store';
import { router } from 'expo-router';
import { useEffect } from 'react';

/** Real connections require an account; send demo users back to tabs. */
export function useDemoGuardRedirectToTabs() {
  const demoMode = useAppStore((s) => s.demoMode);
  useEffect(() => {
    if (demoMode) {
      router.replace('/(tabs)');
    }
  }, [demoMode]);
}
