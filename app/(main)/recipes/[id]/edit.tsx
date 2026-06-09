import { ActivityIndicator, View } from 'react-native';
import { Href, Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { RecipeForm } from '@/components/recipes/RecipeForm';
import { IconButton } from '@/components/ui/IconButton';
import { Heading, Text } from '@/components/ui/Text';
import { useRecipe } from '@/hooks/useRecipes';
import { useResponsive } from '@/hooks/useResponsive';

export default function EditRecipeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDesktop } = useResponsive();
  const { data: recipe, isLoading } = useRecipe(id);

  return (
    <View className={`flex-1 bg-surface dark:bg-surface-dark ${isDesktop ? 'px-8 py-6' : 'px-5 py-5'}`}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="mb-4 flex-row items-center gap-3">
        <IconButton name="arrow-back" accessibilityLabel="Go back" onPress={() => router.back()} />
        <View className="flex-1">
          <Heading level={isDesktop ? 1 : 2}>Edit recipe</Heading>
          <Text variant="bodySecondary">{recipe?.title ?? 'Update recipe details.'}</Text>
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
