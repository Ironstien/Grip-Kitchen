import { View } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { PantryStockForm } from '@/components/pantry/PantryStockForm';
import { IconButton } from '@/components/ui/IconButton';
import { Heading, Text } from '@/components/ui/Text';
import { useResponsive } from '@/hooks/useResponsive';

export default function NewInventoryItemScreen() {
  const router = useRouter();
  const { isDesktop } = useResponsive();

  return (
    <View className={`flex-1 bg-surface dark:bg-surface-dark ${isDesktop ? 'px-8 py-6' : 'px-5 py-5'}`}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="mb-4 flex-row items-center gap-3">
        <IconButton name="arrow-back" accessibilityLabel="Go back" onPress={() => router.back()} />
        <View className="flex-1">
          <Heading level={isDesktop ? 1 : 2}>Add to pantry</Heading>
          <Text variant="bodySecondary">
            Choose an ingredient from your master list and set stock details.
          </Text>
        </View>
      </View>
      <PantryStockForm onSaved={() => router.back()} onCancel={() => router.back()} dense={isDesktop} />
    </View>
  );
}
