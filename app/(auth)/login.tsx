import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { Card } from '@/components/ui';
import { Heading, Text } from '@/components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const { signInWithGoogle, isConfigured } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-[#F7F7F8] dark:bg-[#111111]">
      <View className="flex-1 items-center justify-center px-5">
        <Card className="w-full max-w-md">
          <Heading level={2} className="mb-2 text-center">
            Grip Kitchen
          </Heading>
          <Text variant="bodySecondary" className="mb-8 text-center">
            Plan meals, track your pantry, and shop smarter.
          </Text>

          <GoogleSignInButton onPress={signInWithGoogle} disabled={!isConfigured} />

          {!isConfigured && (
            <Text variant="caption" className="mt-4 text-center">
              Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to a .env file, then
              restart the dev server.
            </Text>
          )}
        </Card>
      </View>
    </SafeAreaView>
  );
}
