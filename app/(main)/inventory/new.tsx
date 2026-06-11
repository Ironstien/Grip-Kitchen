import { ScrollView, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { DetailPaneHeader } from '@/components/layout/DetailPaneHeader';
import { PantryStockForm } from '@/components/pantry/PantryStockForm';
import { detailPaddingClass } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

export default function NewInventoryItemScreen() {
  const router = useRouter();
  const { isDesktop } = useResponsive();

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark">
      <Stack.Screen options={{ headerShown: false }} />
      <DetailPaneHeader
        title="Add to pantry"
        subtitle="Choose an ingredient from your master list and set stock details."
        onBack={() => router.back()}
      />
      <ScrollView
        className="flex-1"
        contentContainerClassName={detailPaddingClass(isDesktop)}
        keyboardShouldPersistTaps="handled">
        <PantryStockForm onSaved={() => router.back()} onCancel={() => router.back()} dense={isDesktop} />
      </ScrollView>
    </View>
  );
}
