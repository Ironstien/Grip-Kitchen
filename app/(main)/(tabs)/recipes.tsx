import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';

import { RecipeGrid } from '@/components/recipes/RecipeGrid';
import { EmptyState } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Text, Heading } from '@/components/ui/Text';
import { RECIPE_TIME_FILTERS, DIETARY_TAG_PRESETS } from '@/constants/recipes';
import { pageHeaderMarginClass, pagePaddingClass } from '@/constants/theme';
import { useIngredients } from '@/hooks/useIngredients';
import { useRecipes } from '@/hooks/useRecipes';
import { useResponsive } from '@/hooks/useResponsive';

export default function RecipesScreen() {
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const [search, setSearch] = useState('');
  const [maxTime, setMaxTime] = useState<number | null>(null);
  const [dietaryTag, setDietaryTag] = useState<string | null>(null);
  const [ingredientFilter, setIngredientFilter] = useState<string | null>(null);

  const { data: ingredients = [] } = useIngredients();
  const { data: recipes = [], isLoading } = useRecipes({
    search,
    maxTime,
    dietaryTag,
    ingredientId: ingredientFilter,
  });

  const ingredientNames = useMemo(() => ingredients.map((item) => item.name), [ingredients]);

  if (isDesktop) {
    return <Redirect href={'/(main)/recipes' as import('expo-router').Href} />;
  }

  const timeLabel =
    RECIPE_TIME_FILTERS.find((filter) => filter.maxMinutes === maxTime)?.label ?? 'Any time';
  const dietaryLabel = dietaryTag ?? 'All tags';
  const ingredientLabel = ingredientFilter
    ? ingredients.find((item) => item.id === ingredientFilter)?.name ?? 'Any ingredient'
    : 'Any ingredient';

  return (
    <ScrollView
      className="flex-1 bg-surface dark:bg-surface-dark"
      contentContainerClassName={`flex-grow ${pagePaddingClass(false)}`}>
      <View className={`${pageHeaderMarginClass(false)}`}>
        <Heading level={2}>Recipes</Heading>
        <Text variant="caption" className="mt-0.5">
          Browse recipes with stock status and cost breakdowns.
        </Text>
      </View>

      <View className="mb-3 gap-2">
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search recipes"
          className="mb-0"
        />
        <Select
          label="Time to cook"
          value={timeLabel}
          options={RECIPE_TIME_FILTERS.map((filter) => filter.label)}
          onChange={(label) => {
            const match = RECIPE_TIME_FILTERS.find((filter) => filter.label === label);
            setMaxTime(match?.maxMinutes ?? null);
          }}
        />
        <Select
          label="Dietary tag"
          value={dietaryLabel}
          options={['All tags', ...DIETARY_TAG_PRESETS]}
          onChange={(value) => setDietaryTag(value === 'All tags' ? null : value)}
        />
        {ingredientNames.length > 0 && (
          <Select
            label="Cook with ingredient"
            value={ingredientLabel}
            options={['Any ingredient', ...ingredientNames]}
            onChange={(value) => {
              if (value === 'Any ingredient') {
                setIngredientFilter(null);
                return;
              }

              const match = ingredients.find((item) => item.name === value);
              setIngredientFilter(match?.id ?? null);
            }}
          />
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator className="mt-4" />
      ) : recipes.length === 0 ? (
        <EmptyState
          title="No recipes yet"
          description="Create a recipe and link pantry ingredients to see stock and cost details."
          actionLabel="Add recipe"
          onAction={() => router.push('/(main)/recipes/new')}
        />
      ) : (
        <RecipeGrid recipes={recipes} />
      )}
    </ScrollView>
  );
}
