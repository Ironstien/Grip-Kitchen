import { mapPantryItem, type PantryItem } from '@/lib/inventory/pantry';
import { tables } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import type { InventoryItem } from '@/types/database';

const INVENTORY_SELECT = `
  *,
  ingredient:ingredient_id (
    id,
    name,
    display_name,
    category,
    stock_unit,
    purchase_price,
    purchase_qty,
    purchase_unit,
    unit_of_measure,
    price_per_unit,
    price_unit_of_measure
  )
`;

export type PantryStockInsertInput = {
  ingredient_id: string;
  quantity: number;
  expiration_date?: string | null;
  location_id?: string | null;
  min_threshold: number;
};

export type PantryStockUpdateInput = Partial<PantryStockInsertInput>;

export async function fetchInventory(locationId?: string | null): Promise<PantryItem[]> {
  let query = supabase.from(tables.inventory).select(INVENTORY_SELECT);

  if (locationId) {
    query = query.eq('location_id', locationId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row) => mapPantryItem(row))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchInventoryItem(id: string): Promise<PantryItem | null> {
  const { data, error } = await supabase
    .from(tables.inventory)
    .select(INVENTORY_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapPantryItem(data) : null;
}

export async function createInventoryItem(input: PantryStockInsertInput): Promise<PantryItem> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from(tables.inventory)
    .insert({
      user_id: user.id,
      ...input,
    })
    .select(INVENTORY_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return mapPantryItem(data);
}

export async function updateInventoryItem(
  id: string,
  input: PantryStockUpdateInput,
): Promise<PantryItem> {
  const { data, error } = await supabase
    .from(tables.inventory)
    .update(input)
    .eq('id', id)
    .select(INVENTORY_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return mapPantryItem(data);
}

export async function deleteInventoryItem(id: string): Promise<void> {
  const { error } = await supabase.from(tables.inventory).delete().eq('id', id);

  if (error) {
    throw error;
  }
}

export async function deleteInventoryItems(ids: string[]): Promise<void> {
  const { error } = await supabase.from(tables.inventory).delete().in('id', ids);

  if (error) {
    throw error;
  }
}

export type { InventoryItem };
