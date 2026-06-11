import { ActivityIndicator, View } from 'react-native';
import { Href, Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { DetailPaneHeader } from '@/components/layout/DetailPaneHeader';
import { RecipeForm } from '@/components/recipes/RecipeForm';
import { detailPaddingClass } from '@/constants/theme';
import { useRecipe } from '@/hooks/useRecipes';
import { useResponsive } from '@/hooks/useResponsive';

export default function EditRecipeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDesktop } = useResponsive();
  const { data: recipe, isLoading } = useRecipe(id);

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark">
      <Stack.Screen options={{ headerShown: false }} />
      <DetailPaneHeader
        title="Edit recipe"
        subtitle={recipe?.title ?? 'Update recipe details.'}
        onBack={() => router.back()}
      />

      {isLoading ? (
        <ActivityIndicator className="mt-8" />
      ) : (
        <View className={`flex-1 ${detailPaddingClass(isDesktop)}`}>
          <RecipeForm
            recipe={recipe}
            onSaved={(recipeId) => router.replace(`/(main)/recipes/${recipeId}` as Href)}
            onCancel={() => router.back()}
          />
        </View>
      )}
    </View>
  );
}
