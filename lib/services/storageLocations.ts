import { DEFAULT_STORAGE_LOCATIONS } from '@/constants/inventory';
import { supabase } from '@/lib/supabase';
import { tables } from '@/lib/database';
import type { StorageLocation } from '@/types/database';

export async function fetchStorageLocations(): Promise<StorageLocation[]> {
  const { data, error } = await supabase
    .from(tables.storageLocations)
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function ensureDefaultStorageLocations(): Promise<StorageLocation[]> {
  const existing = await fetchStorageLocations();

  if (existing.length > 0) {
    return existing;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const rows = DEFAULT_STORAGE_LOCATIONS.map((name, index) => ({
    user_id: user.id,
    name,
    sort_order: index,
  }));

  const { data, error } = await supabase
    .from(tables.storageLocations)
    .insert(rows)
    .select('*');

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createStorageLocation(name: string): Promise<StorageLocation> {
  const existing = await fetchStorageLocations();
  const nextSortOrder =
    existing.length > 0 ? Math.max(...existing.map((location) => location.sort_order)) + 1 : 0;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from(tables.storageLocations)
    .insert({
      user_id: user.id,
      name: name.trim(),
      sort_order: nextSortOrder,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function renameStorageLocation(id: string, name: string): Promise<StorageLocation> {
  const { data, error } = await supabase
    .from(tables.storageLocations)
    .update({ name: name.trim() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function reorderStorageLocations(idsInOrder: string[]): Promise<StorageLocation[]> {
  const updates = idsInOrder.map((id, index) =>
    supabase.from(tables.storageLocations).update({ sort_order: index }).eq('id', id),
  );

  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);

  if (failed?.error) {
    throw failed.error;
  }

  return fetchStorageLocations();
}

export async function deleteStorageLocation(id: string): Promise<void> {
  const { error } = await supabase.from(tables.storageLocations).delete().eq('id', id);

  if (error) {
    throw error;
  }
}
