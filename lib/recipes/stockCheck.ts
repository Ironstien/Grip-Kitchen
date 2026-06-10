import { convertIngredientQuantity } from '@/lib/ingredientConversions';
import type { IngredientConversion } from '@/types/database';

export function isIngredientInStock(
  inventoryQuantity: number,
  inventoryUnit: string,
  requiredQuantity: number,
  requiredUnit: string,
  conversions: IngredientConversion[] = [],
): boolean {
  const { quantity: requiredInInventoryUnit, converted } = convertIngredientQuantity(
    requiredQuantity,
    requiredUnit,
    inventoryUnit,
    conversions,
  );

  if (!converted) {
    return inventoryQuantity >= requiredQuantity;
  }

  return inventoryQuantity >= requiredInInventoryUnit;
}
