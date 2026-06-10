import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { createSessionFromUrl, signInWithGoogle, signOut, subscribeToAuthDeepLinks } from '@/lib/auth';
import { ensureUserProfile } from '@/lib/database';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types/database';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const nextProfile = await ensureUserProfile();
      setProfile(nextProfile);
    } catch (error) {
      console.error('Failed to load user profile', error);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const initialize = async () => {
      try {
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
        ]);

        if (!isMounted) {
          return;
        }

        const initialSession =
          sessionResult && 'data' in sessionResult ? sessionResult.data.session : null;

        setSession(initialSession);
        setIsLoading(false);

        if (initialSession) {
          void loadProfile();
        }
      } catch (error) {
        console.error('Auth initialization failed', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);

      if (nextSession) {
        // Defer profile loading — awaiting Supabase calls here can deadlock session init.
        setTimeout(() => {
          void loadProfile();
        }, 0);
      } else {
        setProfile(null);
      }
    });

    const unsubscribeDeepLinks =
      Platform.OS !== 'web'
        ? subscribeToAuthDeepLinks((url) => {
            void createSessionFromUrl(url);
          })
        : () => undefined;

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      unsubscribeDeepLinks();
    };
  }, [loadProfile]);

  const handleSignInWithGoogle = useCallback(async () => {
    await signInWithGoogle();
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isLoading,
      isConfigured: isSupabaseConfigured,
      signInWithGoogle: handleSignInWithGoogle,
      signOut: handleSignOut,
    }),
    [handleSignInWithGoogle, handleSignOut, isLoading, profile, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
