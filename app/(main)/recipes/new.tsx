import { View } from 'react-native';
import { Href, Stack, useRouter } from 'expo-router';

import { DetailPaneHeader } from '@/components/layout/DetailPaneHeader';
import { RecipeForm } from '@/components/recipes/RecipeForm';
import { detailPaddingClass } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

export default function NewRecipeScreen() {
  const router = useRouter();
  const { isDesktop } = useResponsive();

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark">
      <Stack.Screen options={{ headerShown: false }} />
      <DetailPaneHeader
        title="New recipe"
        subtitle="Link pantry ingredients and preview costs live."
        onBack={() => router.back()}
      />
      <View className={`flex-1 ${detailPaddingClass(isDesktop)}`}>
        <RecipeForm
          onSaved={(recipeId) => router.replace(`/(main)/recipes/${recipeId}` as Href)}
          onCancel={() => router.back()}
        />
      </View>
    </View>
  );
}
