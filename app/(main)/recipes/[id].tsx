import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { Href, Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { DetailPaneHeader } from '@/components/layout/DetailPaneHeader';
import {
  RECIPE_DESKTOP_HERO_HEIGHT,
  RecipeDesktopLayout,
} from '@/components/recipes/RecipeDesktopLayout';
import { RecipeDetailToolbar } from '@/components/recipes/RecipeDetailToolbar';
import { RecipeIngredientList } from '@/components/recipes/RecipeIngredientList';
import { RecipeInstructions } from '@/components/recipes/RecipeInstructions';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { detailPaddingClass } from '@/constants/theme';
import { useRecipeCostBreakdown } from '@/hooks/useRecipeCostBreakdown';
import { useRecipe, useRecipeScaling } from '@/hooks/useRecipes';
import { useResponsive } from '@/hooks/useResponsive';
import { fieldPanelClassName } from '@/lib/fieldStyles';

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDesktop } = useResponsive();
  const { data: recipe, isLoading } = useRecipe(id);
  const { targetServings, setTargetServings } = useRecipeScaling(
    recipe?.base_serving_size ?? 1,
    recipe?.base_serving_size ?? 1,
  );

  const costBreakdown = useRecipeCostBreakdown(
    recipe ?? {
      id: '',
      user_id: '',
      title: '',
      instructions: '',
      base_serving_size: 1,
      time_to_cook: null,
      dietary_tags: [],
      hero_image_url: null,
      recipe_ingredients: [],
    },
    targetServings,
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
    <RecipeIngredientList recipe={recipe} targetServings={targetServings} showCostSummary={!isDesktop} />
  ) : null;

  const instructionsContent = recipe?.instructions ? (
    isDesktop ? (
      <RecipeInstructions instructions={recipe.instructions} />
    ) : (
      <Text>{recipe.instructions}</Text>
    )
  ) : (
    <Text variant="bodySecondary">No instructions added yet.</Text>
  );

  const instructionsSection = (
    <View className="gap-3">
      <Text variant="label">Instructions</Text>
      {instructionsContent}
    </View>
  );

  const dietaryTagsFooter =
    recipe && recipe.dietary_tags.length > 0 ? (
      <Text variant="bodySecondary">{recipe.dietary_tags.join(' · ')}</Text>
    ) : null;

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark">
      <Stack.Screen options={{ headerShown: false }} />

      <DetailPaneHeader
        title={recipe?.title ?? 'Recipe'}
        subtitle={
          !isDesktop && recipe?.time_to_cook != null ? `${recipe.time_to_cook} min` : undefined
        }
        onBack={() => router.back()}
        actions={
          !isDesktop && recipe
            ? [
                {
                  label: 'Edit',
                  onPress: () => router.push(`/(main)/recipes/${recipe.id}/edit` as Href),
                  variant: 'secondary',
                },
              ]
            : []
        }
        toolbar={
          isDesktop && recipe ? (
            <RecipeDetailToolbar
              recipe={recipe}
              targetServings={targetServings}
              totalCost={costBreakdown.costs.totalCost}
              perServingCost={costBreakdown.costs.perServingCost}
              onEdit={() => router.push(`/(main)/recipes/${recipe.id}/edit` as Href)}
              onDecreaseServings={() => setTargetServings(Math.max(1, targetServings - 1))}
              onIncreaseServings={() => setTargetServings(targetServings + 1)}
            />
          ) : undefined
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
              instructions={instructionsSection}
              footer={dietaryTagsFooter}
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

              {servingsControl}
              {ingredientsSection}
              {instructionsSection}
              {dietaryTagsFooter ? (
                <View className={fieldPanelClassName}>{dietaryTagsFooter}</View>
              ) : null}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
