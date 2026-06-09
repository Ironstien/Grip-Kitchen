import { supabase } from '@/lib/supabase';
import { tables } from '@/lib/database';
import type { Ingredient, Recipe, RecipeIngredient } from '@/types/database';

export type RecipeIngredientInput = {
  ingredient_id: string;
  required_quantity: number;
};

export type RecipeInsertInput = {
  title: string;
  instructions: string;
  base_serving_size: number;
  time_to_cook?: number | null;
  dietary_tags: string[];
  hero_image_url?: string | null;
  ingredients: RecipeIngredientInput[];
};

export type RecipeUpdateInput = Partial<Omit<RecipeInsertInput, 'ingredients'>> & {
  ingredients?: RecipeIngredientInput[];
};

export type RecipeWithIngredients = Recipe & {
  recipe_ingredients: Array<
    RecipeIngredient & {
      ingredient: Pick<
        Ingredient,
        'id' | 'name' | 'unit_of_measure' | 'price_per_unit' | 'price_unit_of_measure' | 'category'
      > | null;
    }
  >;
};

export type RecipeFilters = {
  search?: string;
  maxTime?: number | null;
  dietaryTag?: string | null;
  ingredientId?: string | null;
};

export async function fetchRecipes(filters: RecipeFilters = {}): Promise<Recipe[]> {
  let query = supabase.from(tables.recipes).select('*').order('title', { ascending: true });

  if (filters.search?.trim()) {
    query = query.ilike('title', `%${filters.search.trim()}%`);
  }

  if (filters.maxTime != null) {
    query = query.lte('time_to_cook', filters.maxTime);
  }

  if (filters.dietaryTag) {
    query = query.contains('dietary_tags', [filters.dietaryTag]);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  let recipes = data ?? [];

  if (filters.ingredientId) {
    const { data: ingredientLinks, error: ingredientError } = await supabase
      .from(tables.recipeIngredients)
      .select('recipe_id')
      .eq('ingredient_id', filters.ingredientId);

    if (ingredientError) {
      throw ingredientError;
    }

    const recipeIds = new Set((ingredientLinks ?? []).map((row) => row.recipe_id));
    recipes = recipes.filter((recipe) => recipeIds.has(recipe.id));
  }

  return recipes;
}

export async function fetchRecipe(id: string): Promise<RecipeWithIngredients | null> {
  const { data, error } = await supabase
    .from(tables.recipes)
    .select(
      `
      *,
      recipe_ingredients (
        *,
        ingredient:ingredient_id (
          id,
          name,
          unit_of_measure,
          price_per_unit,
          price_unit_of_measure,
          category
        )
      )
    `,
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as RecipeWithIngredients | null;
}

async function replaceRecipeIngredients(
  recipeId: string,
  ingredients: RecipeIngredientInput[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from(tables.recipeIngredients)
    .delete()
    .eq('recipe_id', recipeId);

  if (deleteError) {
    throw deleteError;
  }

  if (ingredients.length === 0) {
    return;
  }

  const rows = ingredients.map((ingredient) => ({
    recipe_id: recipeId,
    ingredient_id: ingredient.ingredient_id,
    required_quantity: ingredient.required_quantity,
  }));

  const { error: insertError } = await supabase.from(tables.recipeIngredients).insert(rows);

  if (insertError) {
    throw insertError;
  }
}

export async function createRecipe(input: RecipeInsertInput): Promise<RecipeWithIngredients> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { ingredients, ...recipeInput } = input;

  const { data, error } = await supabase
    .from(tables.recipes)
    .insert({
      user_id: user.id,
      ...recipeInput,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  await replaceRecipeIngredients(data.id, ingredients);

  const recipe = await fetchRecipe(data.id);

  if (!recipe) {
    throw new Error('Failed to load created recipe');
  }

  return recipe;
}

export async function updateRecipe(
  id: string,
  input: RecipeUpdateInput,
): Promise<RecipeWithIngredients> {
  const { ingredients, ...recipeInput } = input;

  if (Object.keys(recipeInput).length > 0) {
    const { error } = await supabase.from(tables.recipes).update(recipeInput).eq('id', id);

    if (error) {
      throw error;
    }
  }

  if (ingredients) {
    await replaceRecipeIngredients(id, ingredients);
  }

  const recipe = await fetchRecipe(id);

  if (!recipe) {
    throw new Error('Failed to load updated recipe');
  }

  return recipe;
}

export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase.from(tables.recipes).delete().eq('id', id);

  if (error) {
    throw error;
  }
}

export async function uploadRecipeHeroImage(
  recipeId: string,
  uri: string,
  mimeType = 'image/jpeg',
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const extension = mimeType.split('/')[1] ?? 'jpg';
  const path = `${user.id}/${recipeId}/${Date.now()}.${extension}`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from('recipe-photos')
    .upload(path, blob, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from('recipe-photos').getPublicUrl(path);

  return data.publicUrl;
}
