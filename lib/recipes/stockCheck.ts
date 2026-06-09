import { convertQuantity } from '@/lib/units';

export function isIngredientInStock(
  inventoryQuantity: number,
  inventoryUnit: string,
  requiredQuantity: number,
  requiredUnit: string,
): boolean {
  const { quantity: requiredInInventoryUnit, converted } = convertQuantity(
    requiredQuantity,
    requiredUnit,
    inventoryUnit,
  );

  if (!converted) {
    return inventoryQuantity >= requiredQuantity;
  }

  return inventoryQuantity >= requiredInInventoryUnit;
}
