import { ScrollView, View } from 'react-native';
import { Href, Stack, useRouter } from 'expo-router';

import { DetailPaneHeader } from '@/components/layout/DetailPaneHeader';
import { IngredientForm } from '@/components/settings/IngredientForm';
import { detailPaddingClass } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

export default function NewIngredientScreen() {
  const router = useRouter();
  const { isDesktop } = useResponsive();

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark">
      <Stack.Screen options={{ headerShown: false }} />
      <DetailPaneHeader
        title="Add ingredient"
        subtitle="Record how you buy this item — store name, price, quantity, and units."
        onBack={() => router.back()}
      />
      <ScrollView
        className="flex-1"
        contentContainerClassName={detailPaddingClass(isDesktop)}
        keyboardShouldPersistTaps="handled">
        <IngredientForm
          onSaved={(savedId) => {
            if (savedId) {
              router.replace(`/(main)/ingredients/${savedId}` as Href);
              return;
            }
            router.back();
          }}
          onCancel={() => router.back()}
        />
      </ScrollView>
    </View>
  );
}
