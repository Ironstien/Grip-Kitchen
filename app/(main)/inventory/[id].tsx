import { ActivityIndicator, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { PantryStockForm } from '@/components/pantry/PantryStockForm';
import { IconButton } from '@/components/ui/IconButton';
import { Heading, Text } from '@/components/ui/Text';
import { useInventoryItem } from '@/hooks/useInventory';
import { useResponsive } from '@/hooks/useResponsive';

export default function EditInventoryItemScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDesktop } = useResponsive();
  const { data: item, isLoading } = useInventoryItem(id);

  return (
    <View className={`flex-1 bg-surface dark:bg-surface-dark ${isDesktop ? 'px-8 py-6' : 'px-5 py-5'}`}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="mb-4 flex-row items-center gap-3">
        <IconButton name="arrow-back" accessibilityLabel="Go back" onPress={() => router.back()} />
        <View className="flex-1">
          <Heading level={isDesktop ? 1 : 2}>Adjust stock</Heading>
          <Text variant="bodySecondary">{item?.name ?? 'Update quantity, location, and expiry.'}</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <PantryStockForm
          item={item}
          onSaved={() => router.back()}
          onCancel={() => router.back()}
          dense={isDesktop}
        />
      )}
    </View>
  );
}
