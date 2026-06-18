import { mapPantryItem, type PantryItem } from '@/lib/inventory/pantry';
import { tables } from '@/lib/database';
import { defaultShoppingListName } from '@/lib/mealPlan/dates';
import { supabase } from '@/lib/supabase';
import type { ShoppingListSession } from '@/types/database';

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
    price_unit_of_measure,
    image_url
  )
`;

const SHOPPING_LIST_SELECT = `
  *,
  inventory:inventory_item_id (
    ${INVENTORY_SELECT.trim()}
  )
`;

export type ShoppingListEntry = {
  id: string;
  shopping_list_id: string;
  inventory_item_id: string | null;
  target_quantity: number;
  is_purchased: boolean;
  name: string;
  display_name: string;
  category: string;
  stock_unit: string;
  image_url: string | null;
};

type InventoryRowWithIngredient = Parameters<typeof mapPantryItem>[0];

type ShoppingListRow = {
  id: string;
  shopping_list_id: string | null;
  inventory_item_id: string | null;
  target_quantity: number;
  is_purchased: boolean;
  inventory: InventoryRowWithIngredient | InventoryRowWithIngredient[] | null;
};

function resolveInventoryRow(
  inventory: ShoppingListRow['inventory'],
): InventoryRowWithIngredient | null {
  if (!inventory) {
    return null;
  }

  return Array.isArray(inventory) ? inventory[0] ?? null : inventory;
}

function mapShoppingListEntry(row: ShoppingListRow): ShoppingListEntry | null {
  const inventoryRow = resolveInventoryRow(row.inventory);
  if (!inventoryRow || !row.shopping_list_id) {
    return null;
  }

  let pantryItem: PantryItem;
  try {
    pantryItem = mapPantryItem(inventoryRow);
  } catch {
    return null;
  }

  return {
    id: row.id,
    shopping_list_id: row.shopping_list_id,
    inventory_item_id: row.inventory_item_id,
    target_quantity: row.target_quantity,
    is_purchased: row.is_purchased,
    name: pantryItem.name,
    display_name: pantryItem.display_name,
    category: pantryItem.category,
    stock_unit: pantryItem.stock_unit,
    image_url: pantryItem.image_url,
  };
}

function mapShoppingListRows(rows: unknown[]): ShoppingListEntry[] {
  return rows
    .map((row) => mapShoppingListEntry(row as ShoppingListRow))
    .filter((entry): entry is ShoppingListEntry => entry !== null);
}

export async function fetchShoppingLists(status?: 'active' | 'archived'): Promise<ShoppingListSession[]> {
  let query = supabase
    .from(tables.shoppingLists)
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function fetchShoppingListItems(listId: string): Promise<ShoppingListEntry[]> {
  const { data, error } = await supabase
    .from(tables.shoppingList)
    .select(SHOPPING_LIST_SELECT)
    .eq('shopping_list_id', listId)
    .order('is_purchased', { ascending: true });

  if (error) {
    throw error;
  }

  return mapShoppingListRows(data ?? []);
}

export async function fetchActiveShoppingListItems(): Promise<ShoppingListEntry[]> {
  const lists = await fetchShoppingLists('active');
  if (lists.length === 0) {
    return [];
  }

  return fetchShoppingListItems(lists[0].id);
}

export type ShoppingListInsertInput = {
  shopping_list_id: string;
  inventory_item_id: string;
  target_quantity: number;
};

export async function createShoppingList(
  name?: string,
  mealPlanWeekStart?: string | null,
): Promise<ShoppingListSession> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from(tables.shoppingLists)
    .insert({
      user_id: user.id,
      name: name?.trim() || defaultShoppingListName(),
      status: 'active',
      meal_plan_week_start: mealPlanWeekStart ?? null,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateShoppingListSession(
  id: string,
  input: { name?: string },
): Promise<ShoppingListSession> {
  const { data, error } = await supabase
    .from(tables.shoppingLists)
    .update(input)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function archiveShoppingList(id: string): Promise<ShoppingListSession> {
  const { data, error } = await supabase
    .from(tables.shoppingLists)
    .update({
      status: 'archived',
      archived_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getOrCreateDefaultShoppingList(): Promise<ShoppingListSession> {
  const active = await fetchShoppingLists('active');
  if (active.length > 0) {
    return active[0];
  }

  return createShoppingList();
}

export async function createShoppingListItem(
  input: ShoppingListInsertInput,
): Promise<ShoppingListEntry> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from(tables.shoppingList)
    .insert({
      user_id: user.id,
      shopping_list_id: input.shopping_list_id,
      inventory_item_id: input.inventory_item_id,
      target_quantity: input.target_quantity,
    })
    .select(SHOPPING_LIST_SELECT)
    .single();

  if (error) {
    throw error;
  }

  const entry = mapShoppingListEntry(data as unknown as ShoppingListRow);
  if (!entry) {
    throw new Error('Could not load shopping list item.');
  }

  return entry;
}

export async function updateShoppingListItem(
  id: string,
  input: Partial<Pick<ShoppingListInsertInput, 'target_quantity'>> & { is_purchased?: boolean },
): Promise<ShoppingListEntry> {
  const { data, error } = await supabase
    .from(tables.shoppingList)
    .update(input)
    .eq('id', id)
    .select(SHOPPING_LIST_SELECT)
    .single();

  if (error) {
    throw error;
  }

  const entry = mapShoppingListEntry(data as unknown as ShoppingListRow);
  if (!entry) {
    throw new Error('Could not load shopping list item.');
  }

  return entry;
}

export async function deleteShoppingListItem(id: string): Promise<void> {
  const { error } = await supabase.from(tables.shoppingList).delete().eq('id', id);

  if (error) {
    throw error;
  }
}

export async function deleteShoppingList(id: string): Promise<void> {
  const { error } = await supabase.from(tables.shoppingLists).delete().eq('id', id);

  if (error) {
    throw error;
  }
}

export async function findActiveShoppingListEntry(
  listId: string,
  inventoryItemId: string,
): Promise<ShoppingListEntry | null> {
  const { data, error } = await supabase
    .from(tables.shoppingList)
    .select(SHOPPING_LIST_SELECT)
    .eq('shopping_list_id', listId)
    .eq('inventory_item_id', inventoryItemId)
    .eq('is_purchased', false)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapShoppingListEntry(data as unknown as ShoppingListRow);
}

export type MealPlanShoppingLine = {
  ingredientId: string;
  toBuyQuantity: number;
};

export async function createShoppingListFromMealPlan(
  lines: MealPlanShoppingLine[],
  options: { name?: string; weekStart: string },
): Promise<{ list: ShoppingListSession; itemCount: number }> {
  const list = await createShoppingList(options.name, options.weekStart);

  let itemCount = 0;

  for (const line of lines) {
    if (line.toBuyQuantity <= 0) {
      continue;
    }

    const inventoryItemId = await ensureInventoryForIngredient(line.ingredientId);
    await createShoppingListItem({
      shopping_list_id: list.id,
      inventory_item_id: inventoryItemId,
      target_quantity: line.toBuyQuantity,
    });
    itemCount += 1;
  }

  return { list, itemCount };
}

async function ensureInventoryForIngredient(ingredientId: string): Promise<string> {
  const { data: existing, error: fetchError } = await supabase
    .from(tables.inventory)
    .select('id')
    .eq('ingredient_id', ingredientId)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (existing) {
    return existing.id;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: locations } = await supabase
    .from(tables.storageLocations)
    .select('id')
    .order('name', { ascending: true })
    .limit(1);

  const { data: created, error: createError } = await supabase
    .from(tables.inventory)
    .insert({
      user_id: user.id,
      ingredient_id: ingredientId,
      quantity: 0,
      location_id: locations?.[0]?.id ?? null,
      min_threshold: 0,
    })
    .select('id')
    .single();

  if (createError) {
    throw createError;
  }

  return created.id;
}

/** @deprecated use fetchShoppingListItems with a list id */
export async function fetchShoppingList(): Promise<ShoppingListEntry[]> {
  return fetchActiveShoppingListItems();
}
