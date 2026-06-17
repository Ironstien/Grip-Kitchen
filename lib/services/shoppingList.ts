import { mapPantryItem, type PantryItem } from '@/lib/inventory/pantry';
import { tables } from '@/lib/database';
import { supabase } from '@/lib/supabase';

const SHOPPING_LIST_SELECT = `
  *,
  inventory:inventory_item_id (
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
  )
`;

export type ShoppingListEntry = {
  id: string;
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
  if (!inventoryRow) {
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

export async function fetchShoppingList(): Promise<ShoppingListEntry[]> {
  const { data, error } = await supabase
    .from(tables.shoppingList)
    .select(SHOPPING_LIST_SELECT)
    .order('is_purchased', { ascending: true });

  if (error) {
    throw error;
  }

  return mapShoppingListRows(data ?? []);
}

export type ShoppingListInsertInput = {
  inventory_item_id: string;
  target_quantity: number;
};

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
      inventory_item_id: input.inventory_item_id,
      target_quantity: input.target_quantity,
    })
    .select(SHOPPING_LIST_SELECT)
    .single();

  if (error) {
    throw error;
  }

  const entry = mapShoppingListEntry(data as ShoppingListRow);
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

  const entry = mapShoppingListEntry(data as ShoppingListRow);
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

export async function findActiveShoppingListEntry(
  inventoryItemId: string,
): Promise<ShoppingListEntry | null> {
  const { data, error } = await supabase
    .from(tables.shoppingList)
    .select(SHOPPING_LIST_SELECT)
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

  return mapShoppingListEntry(data as ShoppingListRow);
}
