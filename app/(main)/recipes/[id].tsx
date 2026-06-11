import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { Href, Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { DetailPaneHeader } from '@/components/layout/DetailPaneHeader';
import {
  RECIPE_DESKTOP_HERO_HEIGHT,
  RecipeDesktopLayout,
} from '@/components/recipes/RecipeDesktopLayout';
import { RecipeIngredientList } from '@/components/recipes/RecipeIngredientList';
import { RecipeMetadataPanel } from '@/components/recipes/RecipeMetadataPanel';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { detailPaddingClass } from '@/constants/theme';
import { fieldPanelClassName } from '@/lib/fieldStyles';
import { useRecipe, useRecipeScaling } from '@/hooks/useRecipes';
import { useResponsive } from '@/hooks/useResponsive';

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDesktop } = useResponsive();
  const { data: recipe, isLoading } = useRecipe(id);
  const { targetServings, setTargetServings } = useRecipeScaling(
    recipe?.base_serving_size ?? 1,
    recipe?.base_serving_size ?? 1,
  );

  const servingsControl = (
    <View className="flex-row items-center gap-3">
      <Button
        label="-"
        variant="ghost"
        onPress={() => setTargetServings(Math.max(1, targetServings - 1))}
      />
      <Text className="font-medium">{targetServings} servings</Text>
      <Button label="+" variant="ghost" onPress={() => setTargetServings(targetServings + 1)} />
    </View>
  );

  const ingredientsSection = recipe ? (
    <View className="gap-4">
      {servingsControl}
      <RecipeIngredientList recipe={recipe} targetServings={targetServings} />
    </View>
  ) : null;

  const instructionsSection = recipe?.instructions ? (
    <View className={`gap-2 ${isDesktop ? `flex-1 ${fieldPanelClassName}` : ''}`}>
      <Text variant="label">Instructions</Text>
      <Text>{recipe.instructions}</Text>
    </View>
  ) : isDesktop ? (
    <View className={`gap-2 ${fieldPanelClassName}`}>
      <Text variant="label">Instructions</Text>
      <Text variant="bodySecondary">No instructions added yet.</Text>
    </View>
  ) : null;

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark">
      <Stack.Screen options={{ headerShown: false }} />

      <DetailPaneHeader
        title={recipe?.title ?? 'Recipe'}
        subtitle={!isDesktop && recipe?.time_to_cook != null ? `${recipe.time_to_cook} min` : undefined}
        onBack={() => router.back()}
        actions={
          recipe
            ? [
                {
                  label: 'Edit',
                  onPress: () => router.push(`/(main)/recipes/${recipe.id}/edit` as Href),
                  variant: 'secondary',
                },
              ]
            : []
        }
      />

      {isLoading || !recipe ? (
        <ActivityIndicator className="mt-8" />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName={`${detailPaddingClass(isDesktop)} pb-8`}>
          {isDesktop ? (
            <RecipeDesktopLayout
              heroImage={
                recipe.hero_image_url ? (
                  <Image
                    source={{ uri: recipe.hero_image_url }}
                    style={{ width: '100%', height: RECIPE_DESKTOP_HERO_HEIGHT }}
                    contentFit="cover"
                  />
                ) : undefined
              }
              ingredients={ingredientsSection}
              metadata={<RecipeMetadataPanel recipe={recipe} />}
              instructions={instructionsSection}
            />
          ) : (
            <View className="gap-5">
              {recipe.hero_image_url ? (
                <Image
                  source={{ uri: recipe.hero_image_url }}
                  style={{ width: '100%', height: 220, borderRadius: 10 }}
                  contentFit="cover"
                />
              ) : null}

              {recipe.dietary_tags.length > 0 && (
                <Text variant="bodySecondary">{recipe.dietary_tags.join(' · ')}</Text>
              )}

              {ingredientsSection}
              {instructionsSection}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
