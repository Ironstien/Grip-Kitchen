import { useMemo } from 'react';

import { useInventory } from '@/hooks/useInventory';
import { useMealPlanRange } from '@/hooks/useMealPlan';
import {
  aggregateMealPlanIngredients,
  type AggregatedIngredientLine,
} from '@/lib/mealPlan/aggregateIngredients';
import { addDays, toDateKey } from '@/lib/mealPlan/dates';

export function useMealPlanReview(weekStart: Date) {
  const startKey = toDateKey(weekStart);
  const endKey = toDateKey(addDays(weekStart, 6));
  const { data: entries = [], isLoading: planLoading } = useMealPlanRange(startKey, endKey);
  const { data: pantryItems = [], isLoading: pantryLoading } = useInventory(null);

  const stockByIngredient = useMemo(() => {
    const totals = new Map<string, number>();
    for (const item of pantryItems) {
      totals.set(item.ingredient_id, (totals.get(item.ingredient_id) ?? 0) + item.quantity);
    }
    return totals;
  }, [pantryItems]);

  const lines: AggregatedIngredientLine[] = useMemo(
    () => aggregateMealPlanIngredients(entries, stockByIngredient),
    [entries, stockByIngredient],
  );

  const toBuyLines = useMemo(
    () => lines.filter((line) => line.toBuyQuantity > 0),
    [lines],
  );

  const plannedMealCount = entries.length;

  return {
    entries,
    lines,
    toBuyLines,
    plannedMealCount,
    isLoading: planLoading || pantryLoading,
    weekStartKey: startKey,
  };
}
