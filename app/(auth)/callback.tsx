import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { LoadingScreen } from '@/components/auth/LoadingScreen';
import { createSessionFromUrl } from '@/lib/auth';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  }>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const completeAuth = async () => {
      if (params.error) {
        setErrorMessage(params.error_description ?? params.error);
        return;
      }

      if (params.access_token && params.refresh_token) {
        try {
          await createSessionFromUrl(
            `gripkitchen://callback?access_token=${params.access_token}&refresh_token=${params.refresh_token}`,
          );
          router.replace('/(main)/(tabs)');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to complete sign in.';
          setErrorMessage(message);
        }
        return;
      }

      if (typeof window !== 'undefined') {
        const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
        const search = window.location.search.startsWith('?') ? window.location.search.slice(1) : '';
        const query = hash || search;

        if (query) {
          try {
            await createSessionFromUrl(`${window.location.origin}/callback?${query}`);
            router.replace('/(main)/(tabs)');
            return;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to complete sign in.';
            setErrorMessage(message);
            return;
          }
        }
      }

      router.replace('/login');
    };

    void completeAuth();
  }, [params.access_token, params.error, params.error_description, params.refresh_token, router]);

  if (errorMessage) {
    return <LoadingScreen message={errorMessage} />;
  }

  return <LoadingScreen message="Completing sign in..." />;
}
