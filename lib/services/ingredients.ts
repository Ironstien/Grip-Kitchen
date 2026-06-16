import { ensureUserProfile, tables } from '@/lib/database';
import { toError } from '@/lib/errors';
import { syncLegacyIngredientFields } from '@/lib/ingredients';
import { supabase } from '@/lib/supabase';
import type {
  Ingredient,
  IngredientConversion,
  IngredientWithConversions,
  TablesInsert,
} from '@/types/database';

export type IngredientInsertInput = {
  name: string;
  display_name?: string;
  category: string;
  purchase_price: number;
  purchase_qty: number;
  purchase_unit: string;
  stock_unit: string;
  image_url?: string | null;
};

export type IngredientUpdateInput = Partial<IngredientInsertInput>;

function mapIngredientRow(
  row: Ingredient & { ingredient_conversions?: IngredientConversion[] | null },
): IngredientWithConversions {
  const { ingredient_conversions, ...ingredient } = row;

  return {
    ...ingredient,
    ingredient_conversions: ingredient_conversions ?? [],
  };
}

function buildInsertPayload(
  input: IngredientInsertInput,
): Omit<TablesInsert<'ingredients'>, 'user_id'> {
  const stockUnit = input.stock_unit || input.purchase_unit;

  return syncLegacyIngredientFields({
    ...input,
    name: input.name.trim(),
    display_name: input.display_name?.trim() ?? '',
    purchase_price: input.purchase_price,
    purchase_qty: input.purchase_qty,
    purchase_unit: input.purchase_unit,
    stock_unit: stockUnit,
  });
}

export async function fetchIngredients(): Promise<IngredientWithConversions[]> {
  const { data, error } = await supabase
    .from(tables.ingredients)
    .select('*, ingredient_conversions(*)')
    .order('name', { ascending: true });

  if (error) {
    throw toError(error, 'Could not load ingredients.');
  }

  return (data ?? []).map((row) => mapIngredientRow(row as Ingredient & { ingredient_conversions?: IngredientConversion[] }));
}

export async function fetchIngredient(id: string): Promise<IngredientWithConversions | null> {
  const { data, error } = await supabase
    .from(tables.ingredients)
    .select('*, ingredient_conversions(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapIngredientRow(data as Ingredient & { ingredient_conversions?: IngredientConversion[] });
}

export async function createIngredient(input: IngredientInsertInput): Promise<IngredientWithConversions> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  await ensureUserProfile();

  const payload = buildInsertPayload(input);

  const { data, error } = await supabase
    .from(tables.ingredients)
    .insert({
      user_id: user.id,
      ...payload,
    })
    .select('*, ingredient_conversions(*)')
    .single();

  if (error) {
    throw toError(error, 'Could not create ingredient.');
  }

  return mapIngredientRow(data as Ingredient & { ingredient_conversions?: IngredientConversion[] });
}

export async function updateIngredient(
  id: string,
  input: IngredientUpdateInput,
): Promise<IngredientWithConversions> {
  const basePayload: IngredientUpdateInput = {
    ...input,
    ...(input.name ? { name: input.name.trim() } : {}),
    ...(input.display_name !== undefined ? { display_name: input.display_name.trim() } : {}),
  };

  const touchesPurchase =
    basePayload.purchase_price !== undefined ||
    basePayload.purchase_qty !== undefined ||
    basePayload.purchase_unit !== undefined ||
    basePayload.stock_unit !== undefined;

  let payload: IngredientUpdateInput & {
    price_per_unit?: number;
    price_unit_of_measure?: string;
    unit_of_measure?: string;
  } = basePayload;

  if (touchesPurchase) {
    const current = await fetchIngredient(id);
    if (!current) {
      throw new Error('Ingredient not found');
    }

    payload = syncLegacyIngredientFields({
      purchase_price: basePayload.purchase_price ?? current.purchase_price,
      purchase_qty: basePayload.purchase_qty ?? current.purchase_qty,
      purchase_unit: basePayload.purchase_unit ?? current.purchase_unit,
      stock_unit: basePayload.stock_unit ?? current.stock_unit,
      ...basePayload,
    });
  }

  const { data, error } = await supabase
    .from(tables.ingredients)
    .update(payload)
    .eq('id', id)
    .select('*, ingredient_conversions(*)')
    .single();

  if (error) {
    throw error;
  }

  return mapIngredientRow(data as Ingredient & { ingredient_conversions?: IngredientConversion[] });
}

export async function deleteIngredient(id: string): Promise<void> {
  const { error } = await supabase.from(tables.ingredients).delete().eq('id', id);

  if (error) {
    throw error;
  }
}

export async function uploadIngredientImage(
  ingredientId: string,
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
  const path = `${user.id}/${ingredientId}/${Date.now()}.${extension}`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from('ingredient-photos')
    .upload(path, blob, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from('ingredient-photos').getPublicUrl(path);

  return data.publicUrl;
}
