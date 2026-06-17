import { tables } from '@/lib/database';
import { toDateKey } from '@/lib/mealPlan/dates';
import type { MealPlanEntryWithRecipe } from '@/lib/mealPlan/aggregateIngredients';
import { supabase } from '@/lib/supabase';
import type { MealPlanEntry, Recipe } from '@/types/database';

const MEAL_PLAN_SELECT = `
  *,
  recipe:recipe_id (
    *,
    recipe_ingredients (
      *,
      ingredient:ingredient_id (
        id,
        name,
        display_name,
        stock_unit,
        purchase_price,
        purchase_qty,
        purchase_unit,
        unit_of_measure,
        price_per_unit,
        price_unit_of_measure,
        category,
        ingredient_conversions (*)
      )
    )
  )
`;

export type MealPlanUpsertInput = {
  planned_date: string;
  meal_label: string;
  recipe_id: string;
  target_servings: number;
};

export async function fetchMealPlanRange(
  startDate: string,
  endDate: string,
): Promise<MealPlanEntryWithRecipe[]> {
  const { data, error } = await supabase
    .from(tables.mealPlan)
    .select(MEAL_PLAN_SELECT)
    .gte('planned_date', startDate)
    .lte('planned_date', endDate)
    .order('planned_date', { ascending: true })
    .order('meal_label', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as MealPlanEntryWithRecipe[];
}

export async function upsertMealPlanEntry(input: MealPlanUpsertInput): Promise<MealPlanEntry> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from(tables.mealPlan)
    .upsert(
      {
        user_id: user.id,
        planned_date: input.planned_date,
        meal_label: input.meal_label,
        recipe_id: input.recipe_id,
        target_servings: input.target_servings,
      },
      { onConflict: 'user_id,planned_date,meal_label' },
    )
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateMealPlanServings(
  id: string,
  targetServings: number,
): Promise<MealPlanEntry> {
  const { data, error } = await supabase
    .from(tables.mealPlan)
    .update({ target_servings: targetServings })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function clearMealPlanSlot(plannedDate: string, mealLabel: string): Promise<void> {
  const { error } = await supabase
    .from(tables.mealPlan)
    .delete()
    .eq('planned_date', plannedDate)
    .eq('meal_label', mealLabel);

  if (error) {
    throw error;
  }
}

export async function deleteMealPlanEntry(id: string): Promise<void> {
  const { error } = await supabase.from(tables.mealPlan).delete().eq('id', id);

  if (error) {
    throw error;
  }
}

export function buildMealPlanLookup(entries: MealPlanEntryWithRecipe[]) {
  const bySlot = new Map<string, MealPlanEntryWithRecipe>();

  for (const entry of entries) {
    bySlot.set(`${entry.planned_date}:${entry.meal_label}`, entry);
  }

  return bySlot;
}

export function getRecipeTitle(entry: MealPlanEntryWithRecipe | undefined): string | null {
  return entry?.recipe?.title ?? null;
}

export type { Recipe };

export { toDateKey };
