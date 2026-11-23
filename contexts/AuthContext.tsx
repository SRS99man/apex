import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';
import { DEMO_PROFILE, DEMO_USER_ID } from '@/data/demoData';

const previewMode = !isSupabaseConfigured && process.env.EXPO_PUBLIC_PREVIEW_MODE === 'true';

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  configured: boolean;
  previewMode: boolean;
  authenticated: boolean;
  userId: string | null;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(previewMode ? DEMO_PROFILE : null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!session?.user) {
      if (previewMode) return;
      setProfile(null);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();
    setProfile(data);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setProfile(previewMode ? DEMO_PROFILE : null);
      setLoading(false);
      return;
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setTimeout(async () => {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', nextSession.user.id)
          .maybeSingle();
        setProfile(data);
        setLoading(false);
      }, 0);
    });

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) {
        setLoading(false);
        return;
      }

      void supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .maybeSingle()
        .then(({ data: nextProfile }) => {
          setProfile(nextProfile);
          setLoading(false);
        });
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      loading,
      configured: isSupabaseConfigured,
      previewMode,
      authenticated: Boolean(session) || previewMode,
      userId: session?.user.id || (previewMode ? DEMO_USER_ID : null),
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
