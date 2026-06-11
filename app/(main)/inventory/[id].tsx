import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { DetailPaneHeader } from '@/components/layout/DetailPaneHeader';
import { PantryStockForm } from '@/components/pantry/PantryStockForm';
import { detailPaddingClass } from '@/constants/theme';
import { useInventoryItem } from '@/hooks/useInventory';
import { useResponsive } from '@/hooks/useResponsive';

export default function EditInventoryItemScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDesktop } = useResponsive();
  const { data: item, isLoading } = useInventoryItem(id);

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark">
      <Stack.Screen options={{ headerShown: false }} />

      <DetailPaneHeader
        title={item?.name ?? 'Adjust stock'}
        subtitle={item ? 'Update quantity, location, and expiry.' : undefined}
        onBack={() => router.back()}
      />

      {isLoading ? (
        <ActivityIndicator className="mt-8" />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName={detailPaddingClass(isDesktop)}
          keyboardShouldPersistTaps="handled">
          <PantryStockForm
            item={item}
            onSaved={() => router.back()}
            onCancel={() => router.back()}
            dense={isDesktop}
          />
        </ScrollView>
      )}
    </View>
  );
}
