import { convertQuantity } from '@/lib/units';

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
  ingredientUnit: string,
  stockQuantity: number,
  stockUnit: string,
  pricePerUnit: number,
  priceUnit: string,
): { cost: number; converted: boolean } {
  if (pricePerUnit <= 0 || scaledQuantity <= 0 || stockQuantity <= 0) {
    return { cost: 0, converted: true };
  }

  const { quantity: scaledInPriceUnit, converted } = convertQuantity(
    scaledQuantity,
    ingredientUnit,
    priceUnit,
  );

  if (!converted) {
    return { cost: 0, converted: false };
  }

  const cost = scaledInPriceUnit * pricePerUnit;

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
    scaled_quantity: number;
    stock_quantity: number;
    ingredient?: {
      name: string;
      unit_of_measure: string;
      price_per_unit: number;
      price_unit_of_measure: string;
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

    if (!catalog) {
      return {
        ingredientId: entry.ingredient_id,
        name: 'Unknown item',
        scaledQuantity: entry.scaled_quantity,
        unit: 'each',
        cost: 0,
        converted: false,
        inStock: false,
      };
    }

    const { cost, converted } = calculateIngredientCost(
      entry.scaled_quantity,
      catalog.unit_of_measure,
      entry.stock_quantity,
      catalog.unit_of_measure,
      catalog.price_per_unit,
      catalog.price_unit_of_measure,
    );

    const { quantity: requiredInStockUnit, converted: stockConverted } = convertQuantity(
      entry.scaled_quantity,
      catalog.unit_of_measure,
      catalog.unit_of_measure,
    );

    const inStock =
      stockConverted && entry.stock_quantity >= (requiredInStockUnit || entry.scaled_quantity);

    return {
      ingredientId: entry.ingredient_id,
      name: catalog.name,
      scaledQuantity: entry.scaled_quantity,
      unit: catalog.unit_of_measure,
      cost,
      converted,
      inStock,
    };
  });

  const totalCost = lines.reduce((sum, line) => sum + line.cost, 0);
  const perServingCost = servings > 0 ? totalCost / servings : 0;

  return { lines, totalCost, perServingCost };
}
