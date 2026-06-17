import { convertIngredientQuantity } from '@/lib/ingredientConversions';
import { getIngredientDisplayName } from '@/lib/ingredients';
import { scaleIngredientQuantities } from '@/lib/recipeScaling';
import type { RecipeIngredientCatalog } from '@/lib/services/recipes';
import type { MealPlanEntry, Recipe } from '@/types/database';

export type MealPlanEntryWithRecipe = MealPlanEntry & {
  recipe: (Recipe & {
    recipe_ingredients: Array<{
      ingredient_id: string;
      required_quantity: number;
      required_unit: string;
      ingredient: RecipeIngredientCatalog | null;
    }>;
  }) | null;
};

export type AggregatedIngredientLine = {
  ingredientId: string;
  name: string;
  displayName: string;
  category: string;
  stockUnit: string;
  requiredQuantity: number;
  pantryQuantity: number;
  toBuyQuantity: number;
  imageUrl: string | null;
};

type IngredientAccumulator = {
  ingredientId: string;
  catalog: RecipeIngredientCatalog;
  requiredInStockUnit: number;
  stockUnit: string;
};

function addRequiredQuantity(
  acc: IngredientAccumulator,
  quantity: number,
  fromUnit: string,
): IngredientAccumulator {
  const conversions = acc.catalog.ingredient_conversions ?? [];
  const { quantity: converted, converted: ok } = convertIngredientQuantity(
    quantity,
    fromUnit,
    acc.stockUnit,
    conversions,
  );

  if (!ok) {
    return {
      ...acc,
      requiredInStockUnit: acc.requiredInStockUnit + quantity,
    };
  }

  return {
    ...acc,
    requiredInStockUnit: acc.requiredInStockUnit + converted,
  };
}

export function aggregateMealPlanIngredients(
  entries: MealPlanEntryWithRecipe[],
  stockByIngredient: Map<string, number>,
): AggregatedIngredientLine[] {
  const totals = new Map<string, IngredientAccumulator>();

  for (const entry of entries) {
    const recipe = entry.recipe;
    if (!recipe) {
      continue;
    }

    const scaled = scaleIngredientQuantities(
      recipe.recipe_ingredients,
      recipe.base_serving_size,
      entry.target_servings,
    );

    for (const line of scaled) {
      const catalog = line.ingredient;
      if (!catalog) {
        continue;
      }

      const stockUnit = catalog.stock_unit;
      const recipeUnit = line.required_unit || stockUnit;
      const existing = totals.get(line.ingredient_id);

      if (!existing) {
        const { quantity: initialRequired, converted } = convertIngredientQuantity(
          line.scaled_quantity,
          recipeUnit,
          stockUnit,
          catalog.ingredient_conversions ?? [],
        );

        totals.set(line.ingredient_id, {
          ingredientId: line.ingredient_id,
          catalog,
          requiredInStockUnit: converted ? initialRequired : line.scaled_quantity,
          stockUnit,
        });
        continue;
      }

      totals.set(
        line.ingredient_id,
        addRequiredQuantity(existing, line.scaled_quantity, recipeUnit),
      );
    }
  }

  const lines: AggregatedIngredientLine[] = [];

  for (const acc of totals.values()) {
    const pantryQuantity = stockByIngredient.get(acc.ingredientId) ?? 0;
    const toBuyQuantity = Math.max(0, acc.requiredInStockUnit - pantryQuantity);

    lines.push({
      ingredientId: acc.ingredientId,
      name: acc.catalog.name,
      displayName: getIngredientDisplayName(acc.catalog),
      category: acc.catalog.category,
      stockUnit: acc.stockUnit,
      requiredQuantity: acc.requiredInStockUnit,
      pantryQuantity,
      toBuyQuantity,
      imageUrl: null,
    });
  }

  return lines.sort((a, b) => a.displayName.localeCompare(b.displayName));
}
