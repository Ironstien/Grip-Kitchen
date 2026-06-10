import { ActivityIndicator, View } from 'react-native';
import { Href, Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { RecipeForm } from '@/components/recipes/RecipeForm';
import { IconButton } from '@/components/ui/IconButton';
import { Heading, Text } from '@/components/ui/Text';
import { pagePaddingClass } from '@/constants/theme';
import { useRecipe } from '@/hooks/useRecipes';
import { useResponsive } from '@/hooks/useResponsive';

export default function EditRecipeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDesktop } = useResponsive();
  const { data: recipe, isLoading } = useRecipe(id);

  return (
    <View className={`flex-1 bg-surface dark:bg-surface-dark ${pagePaddingClass(isDesktop)}`}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="mb-3 flex-row items-center gap-2">
        <IconButton name="arrow-back" accessibilityLabel="Go back" onPress={() => router.back()} />
        <View className="flex-1">
          <Heading level={isDesktop ? 1 : 2}>Edit recipe</Heading>
          <Text variant="caption">{recipe?.title ?? 'Update recipe details.'}</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <RecipeForm
          recipe={recipe}
          onSaved={(recipeId) => router.replace(`/(main)/recipes/${recipeId}` as Href)}
          onCancel={() => router.back()}
        />
      )}
    </View>
  );
}
