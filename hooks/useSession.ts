import { createDemoSession } from '@/lib/demoData';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

export function useSession() {
  const demoMode = useAppStore((s) => s.demoMode);
  const [session, setSession] = useState<Session | null | undefined>(() =>
    useAppStore.getState().demoMode ? createDemoSession() : undefined,
  );

  useEffect(() => {
    if (demoMode) {
      setSession(createDemoSession());
      return;
    }
    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        setSession(data.session ?? null);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!useAppStore.getState().demoMode) {
        setSession(s);
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [demoMode]);

  return session;
}
