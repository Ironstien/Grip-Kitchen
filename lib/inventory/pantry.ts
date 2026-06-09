import type { InventoryItem } from '@/types/database';

export type PantryItem = InventoryItem & {
  name: string;
  category: string;
  unit_of_measure: string;
  price_per_unit: number;
  price_unit_of_measure: string;
};

type IngredientSnapshot = {
  name: string;
  category: string;
  unit_of_measure: string;
  price_per_unit: number;
  price_unit_of_measure: string;
};

type InventoryRowWithIngredient = InventoryItem & {
  ingredient: IngredientSnapshot | IngredientSnapshot[] | null;
};

function resolveIngredient(
  ingredient: IngredientSnapshot | IngredientSnapshot[] | null | undefined,
): IngredientSnapshot | null {
  if (!ingredient) {
    return null;
  }

  return Array.isArray(ingredient) ? ingredient[0] ?? null : ingredient;
}

export function mapPantryItem(row: InventoryRowWithIngredient): PantryItem {
  const ingredient = resolveIngredient(row.ingredient);

  if (!ingredient) {
    throw new Error('Pantry item is missing ingredient data');
  }

  return {
    ...row,
    name: ingredient.name,
    category: ingredient.category,
    unit_of_measure: ingredient.unit_of_measure,
    price_per_unit: ingredient.price_per_unit,
    price_unit_of_measure: ingredient.price_unit_of_measure,
  };
}

export function getTotalStockQuantity(
  ingredientId: string,
  pantryItems: PantryItem[],
  unit: string,
): number {
  return pantryItems
    .filter((item) => item.ingredient_id === ingredientId)
    .reduce((sum, item) => sum + item.quantity, 0);
}
