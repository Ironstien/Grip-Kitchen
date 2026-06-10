import { useMemo } from 'react';
import { View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/Text';
import { useInventory } from '@/hooks/useInventory';
import { calculateRecipeCosts, formatAud } from '@/lib/cost';
import { getIngredientDisplayName } from '@/lib/ingredients';
import { scaleIngredientQuantities } from '@/lib/recipeScaling';
import { isIngredientInStock } from '@/lib/recipes/stockCheck';
import { formatQuantity } from '@/lib/units';
import type { RecipeWithIngredients } from '@/lib/services/recipes';

type RecipeIngredientListProps = {
  recipe: RecipeWithIngredients;
  targetServings: number;
};

export function RecipeIngredientList({ recipe, targetServings }: RecipeIngredientListProps) {
  const { data: pantryItems = [] } = useInventory();

  const stockByIngredient = useMemo(() => {
    const totals = new Map<string, number>();

    for (const item of pantryItems) {
      totals.set(item.ingredient_id, (totals.get(item.ingredient_id) ?? 0) + item.quantity);
    }

    return totals;
  }, [pantryItems]);

  const scaledIngredients = useMemo(
    () =>
      scaleIngredientQuantities(
        recipe.recipe_ingredients,
        recipe.base_serving_size,
        targetServings,
      ),
    [recipe.base_serving_size, recipe.recipe_ingredients, targetServings],
  );

  const costs = useMemo(
    () =>
      calculateRecipeCosts(
        scaledIngredients.map((entry) => ({
          ingredient_id: entry.ingredient_id,
          required_quantity: entry.required_quantity,
          required_unit: entry.required_unit,
          scaled_quantity: entry.scaled_quantity,
          stock_quantity: stockByIngredient.get(entry.ingredient_id) ?? 0,
          ingredient: entry.ingredient,
        })),
        targetServings,
      ),
    [scaledIngredients, stockByIngredient, targetServings],
  );

  return (
    <View className="gap-3">
      {scaledIngredients.map((entry) => {
        const catalog = entry.ingredient;
        const stockQuantity = stockByIngredient.get(entry.ingredient_id) ?? 0;
        const recipeUnit = entry.required_unit || catalog?.stock_unit || 'each';
        const conversions = catalog?.ingredient_conversions ?? [];

        const inStock = catalog
          ? isIngredientInStock(
              stockQuantity,
              catalog.stock_unit,
              entry.scaled_quantity,
              recipeUnit,
              conversions,
            )
          : false;

        const costLine = costs.lines.find((line) => line.ingredientId === entry.ingredient_id);

        return (
          <View
            key={entry.id}
            className="flex-row items-center justify-between gap-3 rounded-card border border-border px-4 py-3 dark:border-border-dark">
            <View className="flex-1">
              <Text className="font-medium">
                {catalog ? getIngredientDisplayName(catalog) : 'Missing ingredient link'}
              </Text>
              <Text variant="bodySecondary">
                {formatQuantity(entry.scaled_quantity, recipeUnit)}
              </Text>
              {!costLine?.converted ? (
                <Text variant="caption" className="text-status-danger">
                  No conversion rule for cost
                </Text>
              ) : null}
            </View>
            <View className="items-end gap-1">
              <Badge label={inStock ? 'In stock' : 'Missing'} status={inStock ? 'success' : 'danger'} />
              <Text variant="caption">{formatAud(costLine?.cost ?? 0)}</Text>
            </View>
          </View>
        );
      })}

      <View className="mt-2 rounded-card border border-border bg-surface-secondary p-4 dark:border-border-dark dark:bg-surface-dark-secondary">
        <Text variant="label">Cost breakdown</Text>
        <Text className="mt-2 font-semibold">Total: {formatAud(costs.totalCost)}</Text>
        <Text variant="bodySecondary">
          Per serving ({targetServings}): {formatAud(costs.perServingCost)}
        </Text>
      </View>
    </View>
  );
}
