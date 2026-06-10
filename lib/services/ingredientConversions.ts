import { tables } from '@/lib/database';
import { toError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import type { IngredientConversion } from '@/types/database';

export type IngredientConversionInput = {
  from_unit: string;
  to_unit: string;
  factor: number;
};

export async function fetchIngredientConversions(
  ingredientId: string,
): Promise<IngredientConversion[]> {
  const { data, error } = await supabase
    .from(tables.ingredientConversions)
    .select('*')
    .eq('ingredient_id', ingredientId)
    .order('from_unit', { ascending: true });

  if (error) {
    throw toError(error, 'Could not load ingredient conversions.');
  }

  return data ?? [];
}

export async function replaceIngredientConversions(
  ingredientId: string,
  conversions: IngredientConversionInput[],
): Promise<IngredientConversion[]> {
  const { error: deleteError } = await supabase
    .from(tables.ingredientConversions)
    .delete()
    .eq('ingredient_id', ingredientId);

  if (deleteError) {
    throw toError(deleteError, 'Could not update ingredient conversions.');
  }

  if (conversions.length === 0) {
    return [];
  }

  const rows = conversions.map((conversion) => ({
    ingredient_id: ingredientId,
    from_unit: conversion.from_unit,
    to_unit: conversion.to_unit,
    factor: conversion.factor,
  }));

  const { data, error } = await supabase
    .from(tables.ingredientConversions)
    .insert(rows)
    .select('*');

  if (error) {
    throw toError(error, 'Could not save ingredient conversions.');
  }

  return data ?? [];
}
