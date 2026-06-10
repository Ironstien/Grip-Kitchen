import { convertIngredientQuantity } from '@/lib/ingredientConversions';
import { getIngredientDisplayName } from '@/lib/ingredients';
import type { IngredientConversion } from '@/types/database';

export function formatAud(amount: number): string {
  if (!Number.isFinite(amount)) {
    return '$0.00';
  }

  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

export function calculateIngredientCost(
  scaledQuantity: number,
  recipeUnit: string,
  stockQuantity: number,
  stockUnit: string,
  purchasePrice: number,
  purchaseQty: number,
  purchaseUnit: string,
  conversions: IngredientConversion[] = [],
): { cost: number; converted: boolean } {
  if (purchasePrice <= 0 || scaledQuantity <= 0 || purchaseQty <= 0) {
    return { cost: 0, converted: true };
  }

  const { quantity: scaledInPurchaseUnit, converted } = convertIngredientQuantity(
    scaledQuantity,
    recipeUnit,
    purchaseUnit,
    conversions,
  );

  if (!converted) {
    return { cost: 0, converted: false };
  }

  const cost = (scaledInPurchaseUnit / purchaseQty) * purchasePrice;

  return { cost, converted: true };
}

export type IngredientCostLine = {
  ingredientId: string;
  name: string;
  scaledQuantity: number;
  unit: string;
  cost: number;
  converted: boolean;
  inStock: boolean;
};

export function calculateRecipeCosts(
  ingredients: Array<{
    ingredient_id: string;
    required_quantity: number;
    required_unit: string;
    scaled_quantity: number;
    stock_quantity: number;
    ingredient?: {
      name: string;
      display_name: string;
      stock_unit: string;
      purchase_price: number;
      purchase_qty: number;
      purchase_unit: string;
      ingredient_conversions?: IngredientConversion[];
    } | null;
  }>,
  servings: number,
): {
  lines: IngredientCostLine[];
  totalCost: number;
  perServingCost: number;
} {
  const lines: IngredientCostLine[] = ingredients.map((entry) => {
    const catalog = entry.ingredient;
    const conversions = catalog?.ingredient_conversions ?? [];

    if (!catalog) {
      return {
        ingredientId: entry.ingredient_id,
        name: 'Unknown item',
        scaledQuantity: entry.scaled_quantity,
        unit: entry.required_unit,
        cost: 0,
        converted: false,
        inStock: false,
      };
    }

    const recipeUnit = entry.required_unit || catalog.stock_unit;

    const { cost, converted } = calculateIngredientCost(
      entry.scaled_quantity,
      recipeUnit,
      entry.stock_quantity,
      catalog.stock_unit,
      catalog.purchase_price,
      catalog.purchase_qty,
      catalog.purchase_unit,
      conversions,
    );

    const { quantity: requiredInStockUnit, converted: stockConverted } = convertIngredientQuantity(
      entry.scaled_quantity,
      recipeUnit,
      catalog.stock_unit,
      conversions,
    );

    const inStock =
      stockConverted && entry.stock_quantity >= (requiredInStockUnit || entry.scaled_quantity);

    return {
      ingredientId: entry.ingredient_id,
      name: getIngredientDisplayName(catalog),
      scaledQuantity: entry.scaled_quantity,
      unit: recipeUnit,
      cost,
      converted,
      inStock,
    };
  });

  const totalCost = lines.reduce((sum, line) => sum + line.cost, 0);
  const perServingCost = servings > 0 ? totalCost / servings : 0;

  return { lines, totalCost, perServingCost };
}
