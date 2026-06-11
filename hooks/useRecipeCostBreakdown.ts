import { useMemo } from 'react';

import { useInventory } from '@/hooks/useInventory';
import { calculateRecipeCosts } from '@/lib/cost';
import { scaleIngredientQuantities } from '@/lib/recipeScaling';
import { isIngredientInStock } from '@/lib/recipes/stockCheck';
import type { RecipeWithIngredients } from '@/lib/services/recipes';

export function useRecipeCostBreakdown(recipe: RecipeWithIngredients, targetServings: number) {
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

  const stockStatusByIngredient = useMemo(() => {
    const status = new Map<string, boolean>();

    for (const entry of scaledIngredients) {
      const catalog = entry.ingredient;
      const stockQuantity = stockByIngredient.get(entry.ingredient_id) ?? 0;
      const recipeUnit = entry.required_unit || catalog?.stock_unit || 'each';
      const conversions = catalog?.ingredient_conversions ?? [];

      status.set(
        entry.ingredient_id,
        catalog
          ? isIngredientInStock(
              stockQuantity,
              catalog.stock_unit,
              entry.scaled_quantity,
              recipeUnit,
              conversions,
            )
          : false,
      );
    }

    return status;
  }, [scaledIngredients, stockByIngredient]);

  return {
    costs,
    scaledIngredients,
    stockByIngredient,
    stockStatusByIngredient,
  };
}
