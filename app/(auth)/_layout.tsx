import { Redirect, Slot } from 'expo-router';

import { LoadingScreen } from '@/components/auth/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Checking session..." />;
  }

  if (session) {
    return <Redirect href="/(main)/(tabs)" />;
  }

  return <Slot />;
}
