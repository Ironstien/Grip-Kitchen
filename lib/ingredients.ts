import type { Ingredient } from '@/types/database';

export function getIngredientDisplayName(
  ingredient: Pick<Ingredient, 'name' | 'display_name'>,
): string {
  const displayName = ingredient.display_name?.trim();
  return displayName || ingredient.name;
}

export function deriveUnitPrice(purchasePrice: number, purchaseQty: number): number {
  if (!Number.isFinite(purchasePrice) || !Number.isFinite(purchaseQty) || purchaseQty <= 0) {
    return 0;
  }

  return purchasePrice / purchaseQty;
}

export function syncLegacyIngredientFields<
  T extends {
    purchase_price: number;
    purchase_qty: number;
    purchase_unit: string;
    stock_unit: string;
  },
>(input: T): T & {
  price_per_unit: number;
  price_unit_of_measure: string;
  unit_of_measure: string;
} {
  const unitPrice = deriveUnitPrice(input.purchase_price, input.purchase_qty);

  return {
    ...input,
    price_per_unit: unitPrice,
    price_unit_of_measure: input.purchase_unit,
    unit_of_measure: input.stock_unit,
  };
}

export function formatPurchaseSummary(
  ingredient: Pick<Ingredient, 'purchase_price' | 'purchase_qty' | 'purchase_unit'>,
): string {
  const unitPrice = deriveUnitPrice(ingredient.purchase_price, ingredient.purchase_qty);
  const roundedTotal =
    Math.abs(ingredient.purchase_price - Math.round(ingredient.purchase_price)) < 0.01
      ? Math.round(ingredient.purchase_price).toString()
      : ingredient.purchase_price.toFixed(2);

  const roundedUnit =
    Math.abs(unitPrice - Math.round(unitPrice)) < 0.01
      ? Math.round(unitPrice).toString()
      : unitPrice.toFixed(2).replace(/\.?0+$/, '');

  return `$${roundedTotal} for ${ingredient.purchase_qty} ${ingredient.purchase_unit} ($${roundedUnit}/${ingredient.purchase_unit})`;
}
