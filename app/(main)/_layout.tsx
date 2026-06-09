import { Redirect } from 'expo-router';

import { LoadingScreen } from '@/components/auth/LoadingScreen';
import { AppShell } from '@/components/navigation/AppShell';
import { useAuth } from '@/contexts/AuthContext';

export default function MainLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Checking session..." />;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <AppShell />;
}
