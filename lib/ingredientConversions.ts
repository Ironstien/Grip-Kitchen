import { getUnitDefinition, getUnitsInSameFamily, normalizeUnitSymbol } from '@/lib/units';
import type { IngredientConversion } from '@/types/database';

export type ConversionEdge = {
  toUnit: string;
  multiplier: number;
};

function buildIngredientAdjacency(conversions: IngredientConversion[]): Map<string, ConversionEdge[]> {
  const adj = new Map<string, ConversionEdge[]>();

  const addEdge = (from: string, to: string, multiplier: number) => {
    const list = adj.get(from) ?? [];
    list.push({ toUnit: to, multiplier });
    adj.set(from, list);
  };

  for (const rule of conversions) {
    addEdge(rule.from_unit, rule.to_unit, rule.factor);
    addEdge(rule.to_unit, rule.from_unit, 1 / rule.factor);
  }

  return adj;
}

function getStandardMultiplier(fromUnit: string, toUnit: string): number | null {
  const from = getUnitDefinition(fromUnit);
  const to = getUnitDefinition(toUnit);

  if (!from || !to || from.family !== to.family) {
    return null;
  }

  return from.toBaseMultiplier / to.toBaseMultiplier;
}

function unitsMatch(a: string, b: string): boolean {
  return normalizeUnitSymbol(a) === normalizeUnitSymbol(b);
}

function expandUnit(
  unit: string,
  multiplier: number,
  visited: Set<string>,
  ingredientAdj: Map<string, ConversionEdge[]>,
  queue: Array<{ unit: string; multiplier: number }>,
): void {
  for (const edge of ingredientAdj.get(unit) ?? []) {
    const key = normalizeUnitSymbol(edge.toUnit);
    if (visited.has(key)) {
      continue;
    }

    visited.add(key);
    queue.push({ unit: edge.toUnit, multiplier: multiplier * edge.multiplier });
  }

  for (const candidate of getUnitsInSameFamily(unit)) {
    const stdMult = getStandardMultiplier(unit, candidate);
    if (stdMult === null) {
      continue;
    }

    const key = normalizeUnitSymbol(candidate);
    if (visited.has(key)) {
      continue;
    }

    visited.add(key);
    queue.push({ unit: candidate, multiplier: multiplier * stdMult });
  }
}

export function convertIngredientQuantity(
  quantity: number,
  fromUnit: string,
  toUnit: string,
  conversions: IngredientConversion[] = [],
): { quantity: number; converted: boolean } {
  if (!Number.isFinite(quantity)) {
    return { quantity: 0, converted: false };
  }

  if (unitsMatch(fromUnit, toUnit)) {
    return { quantity, converted: true };
  }

  const ingredientAdj = buildIngredientAdjacency(conversions);
  const visited = new Set<string>();
  const queue: Array<{ unit: string; multiplier: number }> = [{ unit: fromUnit, multiplier: 1 }];
  visited.add(normalizeUnitSymbol(fromUnit));

  while (queue.length > 0) {
    const { unit, multiplier } = queue.shift()!;

    if (unitsMatch(unit, toUnit)) {
      return { quantity: quantity * multiplier, converted: true };
    }

    expandUnit(unit, multiplier, visited, ingredientAdj, queue);
  }

  return { quantity, converted: false };
}

export function getReachableUnits(
  startUnit: string,
  conversions: IngredientConversion[] = [],
): string[] {
  const ingredientAdj = buildIngredientAdjacency(conversions);
  const visited = new Set<string>();
  const reachable: string[] = [];
  const queue: Array<{ unit: string; multiplier: number }> = [{ unit: startUnit, multiplier: 1 }];
  visited.add(normalizeUnitSymbol(startUnit));
  reachable.push(startUnit);

  while (queue.length > 0) {
    const { unit, multiplier } = queue.shift()!;
    const before = queue.length;

    expandUnit(unit, multiplier, visited, ingredientAdj, queue);

    for (let index = before; index < queue.length; index += 1) {
      const next = queue[index];
      if (!reachable.some((entry) => unitsMatch(entry, next.unit))) {
        reachable.push(next.unit);
      }
    }
  }

  return reachable;
}

export function getAllowedRecipeUnits(
  stockUnit: string,
  conversions: IngredientConversion[] = [],
): string[] {
  return getReachableUnits(stockUnit, conversions);
}

/** Units pickable in recipe forms: master ingredient units plus conversion rule endpoints. */
export function getIngredientSelectableUnits(
  ingredient: {
    stock_unit: string;
    purchase_unit: string;
    ingredient_conversions?: IngredientConversion[];
  },
): string[] {
  const units = new Set<string>();

  if (ingredient.stock_unit.trim()) {
    units.add(ingredient.stock_unit.trim());
  }

  if (ingredient.purchase_unit.trim()) {
    units.add(ingredient.purchase_unit.trim());
  }

  for (const rule of ingredient.ingredient_conversions ?? []) {
    if (rule.from_unit.trim()) {
      units.add(rule.from_unit.trim());
    }
    if (rule.to_unit.trim()) {
      units.add(rule.to_unit.trim());
    }
  }

  return Array.from(units).sort((a, b) => a.localeCompare(b));
}

export function canConvertIngredientUnits(
  fromUnit: string,
  toUnit: string,
  conversions: IngredientConversion[] = [],
): boolean {
  return convertIngredientQuantity(1, fromUnit, toUnit, conversions).converted;
}
