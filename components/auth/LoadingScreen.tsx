import { ActivityIndicator, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/contexts/ThemeContext';

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  const { palette } = useTheme();

  return (
    <View className="flex-1 items-center justify-center bg-surface px-6 dark:bg-surface-dark">
      <ActivityIndicator size="large" color={palette.brand} />
      <Text variant="bodySecondary" className="mt-4">
        {message}
      </Text>
    </View>
  );
}
