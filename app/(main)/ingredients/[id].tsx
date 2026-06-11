import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { DetailPaneHeader } from '@/components/layout/DetailPaneHeader';
import { IngredientForm } from '@/components/settings/IngredientForm';
import { detailPaddingClass } from '@/constants/theme';
import { useIngredient } from '@/hooks/useIngredients';
import { useResponsive } from '@/hooks/useResponsive';
import { getIngredientDisplayName } from '@/lib/ingredients';

export default function IngredientDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDesktop } = useResponsive();
  const { data: ingredient, isLoading } = useIngredient(id);

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark">
      <Stack.Screen options={{ headerShown: false }} />

      <DetailPaneHeader
        title={ingredient ? getIngredientDisplayName(ingredient) : 'Ingredient'}
        subtitle={ingredient?.category}
        onBack={() => router.back()}
      />

      {isLoading ? (
        <ActivityIndicator className="mt-8" />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName={detailPaddingClass(isDesktop)}
          keyboardShouldPersistTaps="handled">
          <IngredientForm
            ingredient={ingredient}
            onSaved={() => {
              if (!isDesktop) {
                router.back();
              }
            }}
            onCancel={() => router.back()}
          />
        </ScrollView>
      )}
    </View>
  );
}
