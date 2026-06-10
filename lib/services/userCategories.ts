import { DEFAULT_USER_CATEGORIES } from '@/constants/inventory';
import { ensureUserProfile, tables } from '@/lib/database';
import { toError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import type { UserCategory } from '@/types/database';

export async function fetchUserCategories(): Promise<UserCategory[]> {
  const { data, error } = await supabase
    .from(tables.userCategories)
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    throw toError(error, 'Could not load categories.');
  }

  return data ?? [];
}

export async function ensureDefaultUserCategories(): Promise<UserCategory[]> {
  const existing = await fetchUserCategories();

  if (existing.length > 0) {
    return existing;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  await ensureUserProfile();

  const rows = DEFAULT_USER_CATEGORIES.map((name, index) => ({
    user_id: user.id,
    name,
    sort_order: index,
    is_system: true,
  }));

  const { data, error } = await supabase.from(tables.userCategories).insert(rows).select('*');

  if (error) {
    throw toError(error, 'Could not seed categories.');
  }

  return data ?? [];
}

export async function createUserCategory(name: string): Promise<UserCategory> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Category name is required.');
  }

  const existing = await fetchUserCategories();
  const duplicate = existing.some(
    (category) => category.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );

  if (duplicate) {
    throw new Error('That category already exists.');
  }

  const nextSortOrder =
    existing.length > 0 ? Math.max(...existing.map((category) => category.sort_order)) + 1 : 0;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from(tables.userCategories)
    .insert({
      user_id: user.id,
      name: trimmed,
      sort_order: nextSortOrder,
      is_system: false,
    })
    .select('*')
    .single();

  if (error) {
    throw toError(error, 'Could not add category.');
  }

  return data;
}

export async function renameUserCategory(id: string, name: string): Promise<UserCategory> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Category name is required.');
  }

  const { data, error } = await supabase
    .from(tables.userCategories)
    .update({ name: trimmed })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw toError(error, 'Could not rename category.');
  }

  return data;
}

export async function deleteUserCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from(tables.userCategories)
    .delete()
    .eq('id', id)
    .eq('is_system', false);

  if (error) {
    throw toError(error, 'Could not delete category.');
  }
}
