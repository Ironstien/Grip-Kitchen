import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { Href, Stack, useLocalSearchParams, useRouter } from 'expo-router';

import {
  RECIPE_DESKTOP_HERO_HEIGHT,
  RecipeDesktopLayout,
} from '@/components/recipes/RecipeDesktopLayout';
import { RecipeIngredientList } from '@/components/recipes/RecipeIngredientList';
import { RecipeMetadataPanel } from '@/components/recipes/RecipeMetadataPanel';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Heading, Text } from '@/components/ui/Text';
import { fieldPanelClassName } from '@/lib/fieldStyles';
import { pagePaddingClass } from '@/constants/theme';
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
    <ScrollView
      className="flex-1 bg-surface dark:bg-surface-dark"
      contentContainerClassName={`${pagePaddingClass(isDesktop)} pb-8`}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="mb-3 flex-row items-center gap-2">
        <IconButton name="arrow-back" accessibilityLabel="Go back" onPress={() => router.back()} />
        <View className="flex-1">
          <Heading level={isDesktop ? 1 : 2}>{recipe?.title ?? 'Recipe'}</Heading>
          {!isDesktop && recipe?.time_to_cook != null && (
            <Text variant="caption">{recipe.time_to_cook} min</Text>
          )}
        </View>
        {recipe && (
          <Button
            label="Edit"
            variant="secondary"
            onPress={() => router.push(`/(main)/recipes/${recipe.id}/edit` as Href)}
          />
        )}
      </View>

      {isLoading || !recipe ? (
        <ActivityIndicator />
      ) : isDesktop ? (
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
  );
}
