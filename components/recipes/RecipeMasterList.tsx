import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Href, usePathname, useRouter } from 'expo-router';

import {
  MasterListEmpty,
  MasterListPane,
  MasterListRow,
} from '@/components/layout/MasterListPane';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { RECIPE_TIME_FILTERS } from '@/constants/recipes';
import { useAllDietaryTags } from '@/hooks/useAllDietaryTags';
import { useIngredients } from '@/hooks/useIngredients';
import { useRecipes } from '@/hooks/useRecipes';

function getSelectedRecipeId(pathname: string): string | null {
  const match = pathname.match(/\/recipes\/([^/]+)/);
  if (!match || match[1] === 'new') {
    return null;
  }
  return match[1];
}

export function RecipeMasterList() {
  const router = useRouter();
  const pathname = usePathname();
  const selectedId = getSelectedRecipeId(pathname);

  const [search, setSearch] = useState('');
  const [maxTime, setMaxTime] = useState<number | null>(null);
  const [dietaryTag, setDietaryTag] = useState<string | null>(null);
  const [ingredientFilter, setIngredientFilter] = useState<string | null>(null);

  const { data: ingredients = [] } = useIngredients();
  const { tags: dietaryTagOptions } = useAllDietaryTags();
  const { data: recipes = [], isLoading } = useRecipes({
    search,
    maxTime,
    dietaryTag,
    ingredientId: ingredientFilter,
  });

  const ingredientNames = useMemo(() => ingredients.map((item) => item.name), [ingredients]);

  const timeLabel =
    RECIPE_TIME_FILTERS.find((filter) => filter.maxMinutes === maxTime)?.label ?? 'Any time';
  const dietaryLabel = dietaryTag ?? 'All tags';
  const ingredientLabel = ingredientFilter
    ? ingredients.find((item) => item.id === ingredientFilter)?.name ?? 'Any ingredient'
    : 'Any ingredient';

  const filters = (
    <View className="gap-1.5">
      <Input
        value={search}
        onChangeText={setSearch}
        placeholder="Search recipes"
        className="mb-0"
      />
      <View className="flex-row gap-1.5">
        <Select
          value={timeLabel}
          options={RECIPE_TIME_FILTERS.map((filter) => filter.label)}
          onChange={(label) => {
            const match = RECIPE_TIME_FILTERS.find((filter) => filter.label === label);
            setMaxTime(match?.maxMinutes ?? null);
          }}
          placeholder="Time"
          className="min-w-0 flex-1"
        />
        <Select
          value={dietaryLabel}
          options={['All tags', ...dietaryTagOptions]}
          onChange={(value) => setDietaryTag(value === 'All tags' ? null : value)}
          placeholder="Dietary"
          className="min-w-0 flex-1"
        />
        {ingredientNames.length > 0 ? (
          <Select
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
            placeholder="Ingredient"
            className="min-w-0 flex-1"
          />
        ) : null}
      </View>
    </View>
  );

  return (
    <MasterListPane
      title="All Recipes"
      createLabel="Add recipe"
      onCreate={() => router.push('/(main)/recipes/new' as Href)}
      filters={filters}>
      {isLoading ? (
        <ActivityIndicator className="mt-6" />
      ) : recipes.length === 0 ? (
        <MasterListEmpty message="No recipes match your filters." />
      ) : (
        <ScrollView className="flex-1">
          {recipes.map((recipe) => (
            <MasterListRow
              key={recipe.id}
              title={recipe.title}
              subtitle={
                recipe.dietary_tags.length > 0 ? recipe.dietary_tags.join(' · ') : undefined
              }
              meta={`${recipe.base_serving_size} servings`}
              trailing={recipe.time_to_cook != null ? `${recipe.time_to_cook} min` : undefined}
              imageUrl={recipe.hero_image_url}
              showThumbnail
              thumbnailPosition="leading"
              selected={selectedId === recipe.id}
              onPress={() => router.push(`/(main)/recipes/${recipe.id}` as Href)}
            />
          ))}
        </ScrollView>
      )}
    </MasterListPane>
  );
}
