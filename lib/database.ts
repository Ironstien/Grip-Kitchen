import { supabase } from '@/lib/supabase';
import type {
  BarcodeCacheEntry,
  Ingredient,
  InventoryItem,
  MealPlanEntry,
  Recipe,
  RecipeIngredient,
  ShoppingListItem,
  StorageLocation,
  UserProfile,
  WasteLogEntry,
} from '@/types/database';

export const tables = {
  users: 'users',
  userUnits: 'user_units',
  ingredients: 'ingredients',
  storageLocations: 'storage_locations',
  inventory: 'inventory',
  recipes: 'recipes',
  recipeIngredients: 'recipe_ingredients',
  mealPlan: 'meal_plan',
  shoppingList: 'shopping_list',
  wasteLog: 'waste_log',
  barcodeCache: 'barcode_cache',
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

  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        id: user.id,
        email: user.email ?? '',
      },
      { onConflict: 'id' },
    )
    .select('*')
    .single();

  if (error) {
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
  StorageLocation,
  UserProfile,
  WasteLogEntry,
};
