export function scaleQuantity(
  requiredQuantity: number,
  baseServings: number,
  targetServings: number,
): number {
  if (baseServings <= 0 || targetServings <= 0 || !Number.isFinite(requiredQuantity)) {
    return 0;
  }

  return (targetServings / baseServings) * requiredQuantity;
}

export function scaleIngredientQuantities<T extends { required_quantity: number }>(
  ingredients: T[],
  baseServings: number,
  targetServings: number,
): Array<T & { scaled_quantity: number }> {
  return ingredients.map((ingredient) => ({
    ...ingredient,
    scaled_quantity: scaleQuantity(
      ingredient.required_quantity,
      baseServings,
      targetServings,
    ),
  }));
}
