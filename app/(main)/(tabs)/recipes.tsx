import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import { RecipeGrid } from '@/components/recipes/RecipeGrid';
import { EmptyState } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Text, Heading } from '@/components/ui/Text';
import { OptionSelect } from '@/components/ui/Form';
import { RECIPE_TIME_FILTERS, DIETARY_TAG_PRESETS } from '@/constants/recipes';
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

  return (
    <ScrollView
      className="flex-1 bg-surface dark:bg-surface-dark"
      contentContainerClassName={`flex-grow ${isDesktop ? 'px-8 py-6' : 'px-5 py-5'}`}>
      <View className={isDesktop ? 'mb-4' : 'mb-6'}>
        <Heading level={isDesktop ? 1 : 2}>Recipes</Heading>
        <Text variant="bodySecondary" className="mt-1">
          Browse recipes with stock status and cost breakdowns.
        </Text>
      </View>

      <Input
        value={search}
        onChangeText={setSearch}
        placeholder="Search recipes"
        className="mb-4"
      />

      <OptionSelect
        label="Time to cook"
        value={RECIPE_TIME_FILTERS.find((filter) => filter.maxMinutes === maxTime)?.label ?? 'Any time'}
        options={RECIPE_TIME_FILTERS.map((filter) => filter.label)}
        onChange={(label) => {
          const match = RECIPE_TIME_FILTERS.find((filter) => filter.label === label);
          setMaxTime(match?.maxMinutes ?? null);
        }}
        className="mb-4"
      />

      <OptionSelect
        label="Dietary tag"
        value={dietaryTag ?? 'All tags'}
        options={['All tags', ...DIETARY_TAG_PRESETS]}
        onChange={(value) => setDietaryTag(value === 'All tags' ? null : value)}
        className="mb-4"
      />

      {ingredientNames.length > 0 && (
        <OptionSelect
          label="Cook with ingredient"
          value={
            ingredientFilter
              ? ingredients.find((item) => item.id === ingredientFilter)?.name ?? 'Any ingredient'
              : 'Any ingredient'
          }
          options={['Any ingredient', ...ingredientNames]}
          onChange={(value) => {
            if (value === 'Any ingredient') {
              setIngredientFilter(null);
              return;
            }

            const match = ingredients.find((item) => item.name === value);
            setIngredientFilter(match?.id ?? null);
          }}
          className="mb-4"
        />
      )}

      {isLoading ? (
        <ActivityIndicator className="mt-8" />
      ) : recipes.length === 0 ? (
        <EmptyState
          title="No recipes yet"
          description="Create a recipe and link pantry ingredients to see stock and cost details."
          actionLabel="Add recipe"
          onAction={() => router.push('/(main)/recipes/new')}
        />
      ) : (
        <RecipeGrid recipes={recipes} dense={isDesktop} />
      )}
    </ScrollView>
  );
}
