export const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Other'] as const;

export type MealSlot = (typeof MEAL_SLOTS)[number];

export function isMealSlot(value: string): value is MealSlot {
  return (MEAL_SLOTS as readonly string[]).includes(value);
}
