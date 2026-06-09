import { useMemo, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { IngredientForm } from '@/components/settings/IngredientForm';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useIngredients } from '@/hooks/useIngredients';
import { formatPricePerUnit } from '@/lib/price';
import type { Ingredient } from '@/types/database';

export function MasterIngredientsManager() {
  const { data: ingredients = [], isLoading } = useIngredients();
  const [search, setSearch] = useState('');
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null | undefined>(
    undefined,
  );

  const filteredIngredients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return ingredients;
    }

    return ingredients.filter(
      (ingredient) =>
        ingredient.name.toLowerCase().includes(query) ||
        ingredient.category.toLowerCase().includes(query),
    );
  }, [ingredients, search]);

  const closeEditor = () => setEditingIngredient(undefined);

  if (isLoading) {
    return <Text variant="bodySecondary">Loading master list...</Text>;
  }

  return (
    <View className="gap-4">
      <Text variant="label">Master ingredient list</Text>
      <Text variant="bodySecondary">
        Add and edit ingredient details here — name, category, units, and pricing. The pantry only
        tracks what you have in stock.
      </Text>

      <View className="flex-row gap-3">
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search ingredients"
          className="flex-1"
        />
        <Button label="Add" onPress={() => setEditingIngredient(null)} />
      </View>

      {filteredIngredients.length === 0 ? (
        <Text variant="bodySecondary">
          {ingredients.length === 0
            ? 'No ingredients yet. Add your first item to the master list.'
            : 'No ingredients match your search.'}
        </Text>
      ) : (
        filteredIngredients.map((ingredient) => (
          <Pressable
            key={ingredient.id}
            onPress={() => setEditingIngredient(ingredient)}
            className="rounded-card border border-border px-3 py-3 dark:border-border-dark">
            <Text className="font-medium">{ingredient.name}</Text>
            <Text variant="bodySecondary">
              {ingredient.category} · {ingredient.unit_of_measure}
            </Text>
            <Text variant="caption" className="mt-1">
              {formatPricePerUnit(ingredient.price_per_unit, ingredient.price_unit_of_measure)}
            </Text>
          </Pressable>
        ))
      )}

      <Modal
        visible={editingIngredient !== undefined}
        transparent
        animationType="slide"
        onRequestClose={closeEditor}>
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="absolute inset-0" onPress={closeEditor} />
          <View className="max-h-[85%] rounded-t-card border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
            <Text className="mb-4 text-lg font-semibold">
              {editingIngredient ? 'Edit ingredient' : 'Add ingredient'}
            </Text>
            <IngredientForm
              ingredient={editingIngredient}
              onSaved={closeEditor}
              onCancel={closeEditor}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
