import { supabase } from '@/lib/supabase';
import type {
  BarcodeCacheEntry,
  Ingredient,
  InventoryItem,
  MealPlanEntry,
  Recipe,
  RecipeIngredient,
  ShoppingListItem,
  ShoppingListSession,
  StorageLocation,
  UserProfile,
  WasteLogEntry,
} from '@/types/database';

export const tables = {
  users: 'users',
  userUnits: 'user_units',
  userCategories: 'user_categories',
  ingredients: 'ingredients',
  ingredientConversions: 'ingredient_conversions',
  storageLocations: 'storage_locations',
  inventory: 'inventory',
  recipes: 'recipes',
  recipeIngredients: 'recipe_ingredients',
  mealPlan: 'meal_plan',
  shoppingLists: 'shopping_lists',
  shoppingList: 'shopping_list',
  wasteLog: 'waste_log',
  barcodeCache: 'barcode_cache',
  notes: 'notes',
  financeSettings: 'finance_settings',
  recurringExpenses: 'recurring_expenses',
} as const;

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function ensureUserProfile(): Promise<UserProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const existing = await getCurrentUserProfile();
  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      id: user.id,
      email: user.email ?? '',
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      return getCurrentUserProfile();
    }
    throw error;
  }

  return data;
}

export type {
  BarcodeCacheEntry,
  Ingredient,
  InventoryItem,
  MealPlanEntry,
  Recipe,
  RecipeIngredient,
  ShoppingListItem,
  ShoppingListSession,
  StorageLocation,
  UserProfile,
  WasteLogEntry,
};
