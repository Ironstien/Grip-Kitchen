import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useMealPlanMutations } from '@/hooks/useMealPlan';
import { useRecipes } from '@/hooks/useRecipes';
import type { MealPlanEntryWithRecipe } from '@/lib/mealPlan/aggregateIngredients';
import type { MealSlot } from '@/lib/mealPlan/constants';
import { formatDayShort } from '@/lib/mealPlan/dates';
import { cn } from '@/lib/cn';

type MealSlotSheetProps = {
  visible: boolean;
  onClose: () => void;
  plannedDate: string;
  mealLabel: MealSlot;
  entry?: MealPlanEntryWithRecipe;
  weekStartKey: string;
  weekEndKey: string;
};

export function MealSlotSheet({
  visible,
  onClose,
  plannedDate,
  mealLabel,
  entry,
  weekStartKey,
  weekEndKey,
}: MealSlotSheetProps) {
  const [search, setSearch] = useState('');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(entry?.recipe_id ?? null);
  const [servings, setServings] = useState(String(entry?.target_servings ?? 2));

  const { data: recipes = [], isLoading } = useRecipes({ search });
  const { upsert, clearSlot } = useMealPlanMutations(weekStartKey, weekEndKey);

  useEffect(() => {
    if (visible) {
      setSelectedRecipeId(entry?.recipe_id ?? null);
      setServings(String(entry?.target_servings ?? 2));
      setSearch('');
    }
  }, [visible, entry?.recipe_id, entry?.target_servings]);

  const dateLabel = useMemo(() => formatDayShort(new Date(plannedDate + 'T12:00:00')), [plannedDate]);

  const filteredRecipes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return recipes;
    }
    return recipes.filter((recipe) => recipe.title.toLowerCase().includes(query));
  }, [recipes, search]);

  const parsedServings = Number(servings);
  const servingsValid = Number.isFinite(parsedServings) && parsedServings > 0;

  const handleSave = async () => {
    if (!selectedRecipeId || !servingsValid) {
      return;
    }

    await upsert.mutateAsync({
      planned_date: plannedDate,
      meal_label: mealLabel,
      recipe_id: selectedRecipeId,
      target_servings: parsedServings,
    });
    onClose();
  };

  const handleClear = async () => {
    await clearSlot.mutateAsync({ plannedDate, mealLabel });
    onClose();
  };

  const isSaving = upsert.isPending || clearSlot.isPending;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={`${mealLabel} · ${dateLabel}`}>
      <View className="max-h-[70vh] gap-3 pb-2">
        <Input value={search} onChangeText={setSearch} placeholder="Search recipes" />

        <View>
          <Text variant="label" className="mb-1">
            Servings
          </Text>
          <Input
            value={servings}
            onChangeText={setServings}
            keyboardType="decimal-pad"
            placeholder="2"
          />
        </View>

        <Text variant="label">Recipe</Text>
        {isLoading ? (
          <ActivityIndicator className="py-4" />
        ) : (
          <FlatList
            data={filteredRecipes}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 240 }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text variant="bodySecondary" className="py-4 text-center">
                No recipes found.
              </Text>
            }
            renderItem={({ item }) => {
              const selected = selectedRecipeId === item.id;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setSelectedRecipeId(item.id)}
                  className={cn(
                    'mb-1 rounded-button border px-3 py-2.5',
                    selected
                      ? 'border-brand bg-brand/10 dark:border-brand-dark'
                      : 'border-border dark:border-border-dark',
                  )}>
                  <Text className="font-medium">{item.title}</Text>
                  {item.time_to_cook != null ? (
                    <Text variant="caption">{item.time_to_cook} min</Text>
                  ) : null}
                </Pressable>
              );
            }}
          />
        )}

        <View className="flex-row gap-2 pt-1">
          {entry ? (
            <Button
              label="Remove"
              variant="ghost"
              onPress={() => void handleClear()}
              disabled={isSaving}
              className="flex-1"
            />
          ) : null}
          <Button
            label="Save"
            onPress={() => void handleSave()}
            disabled={!selectedRecipeId || !servingsValid || isSaving}
            className="flex-1"
          />
        </View>
      </View>
    </BottomSheet>
  );
}
