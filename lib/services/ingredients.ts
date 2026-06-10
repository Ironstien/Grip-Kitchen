import { ensureUserProfile, tables } from '@/lib/database';
import { toError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import type { Ingredient } from '@/types/database';

export type IngredientInsertInput = {
  name: string;
  category: string;
  unit_of_measure: string;
  price_per_unit: number;
  price_unit_of_measure: string;
};

export type IngredientUpdateInput = Partial<IngredientInsertInput>;

export async function fetchIngredients(): Promise<Ingredient[]> {
  const { data, error } = await supabase
    .from(tables.ingredients)
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw toError(error, 'Could not load ingredients.');
  }

  return data ?? [];
}

export async function fetchIngredient(id: string): Promise<Ingredient | null> {
  const { data, error } = await supabase
    .from(tables.ingredients)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createIngredient(input: IngredientInsertInput): Promise<Ingredient> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  await ensureUserProfile();

  const { data, error } = await supabase
    .from(tables.ingredients)
    .insert({
      user_id: user.id,
      name: input.name.trim(),
      category: input.category,
      unit_of_measure: input.unit_of_measure,
      price_per_unit: input.price_per_unit,
      price_unit_of_measure: input.price_unit_of_measure,
    })
    .select('*')
    .single();

  if (error) {
    throw toError(error, 'Could not create ingredient.');
  }

  return data;
}

export async function updateIngredient(
  id: string,
  input: IngredientUpdateInput,
): Promise<Ingredient> {
  const payload = {
    ...input,
    ...(input.name ? { name: input.name.trim() } : {}),
  };

  const { data, error } = await supabase
    .from(tables.ingredients)
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteIngredient(id: string): Promise<void> {
  const { error } = await supabase.from(tables.ingredients).delete().eq('id', id);

  if (error) {
    throw error;
  }
}
