import { DEFAULT_USER_UNITS, type UnitFamily } from '@/constants/inventory';
import { tables } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { registerUserUnits } from '@/lib/units';
import type { UserUnit } from '@/types/database';

export type UserUnitInsertInput = {
  symbol: string;
  label: string;
  family: UnitFamily;
  base_unit: string;
  to_base_multiplier: number;
};

export type UserUnitUpdateInput = Partial<
  Pick<UserUnitInsertInput, 'label' | 'base_unit' | 'to_base_multiplier'>
>;

export async function fetchUserUnits(): Promise<UserUnit[]> {
  const { data, error } = await supabase
    .from(tables.userUnits)
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function ensureDefaultUserUnits(): Promise<UserUnit[]> {
  const existing = await fetchUserUnits();

  if (existing.length > 0) {
    registerUserUnits(existing);
    return existing;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const rows = DEFAULT_USER_UNITS.map((unit, index) => ({
    user_id: user.id,
    symbol: unit.symbol,
    label: unit.label,
    family: unit.family,
    base_unit: unit.base_unit,
    to_base_multiplier: unit.to_base_multiplier,
    sort_order: index,
    is_system: true,
  }));

  const { data, error } = await supabase.from(tables.userUnits).insert(rows).select('*');

  if (error) {
    throw error;
  }

  const units = data ?? [];
  registerUserUnits(units);
  return units;
}

export async function createUserUnit(input: UserUnitInsertInput): Promise<UserUnit> {
  const existing = await fetchUserUnits();
  const nextSortOrder =
    existing.length > 0 ? Math.max(...existing.map((unit) => unit.sort_order)) + 1 : 0;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from(tables.userUnits)
    .insert({
      user_id: user.id,
      symbol: input.symbol.trim(),
      label: input.label.trim() || input.symbol.trim(),
      family: input.family,
      base_unit: input.base_unit,
      to_base_multiplier: input.to_base_multiplier,
      sort_order: nextSortOrder,
      is_system: false,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateUserUnit(id: string, input: UserUnitUpdateInput): Promise<UserUnit> {
  const { data, error } = await supabase
    .from(tables.userUnits)
    .update(input)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteUserUnit(id: string): Promise<void> {
  const { error } = await supabase.from(tables.userUnits).delete().eq('id', id).eq('is_system', false);

  if (error) {
    throw error;
  }
}

export function formatUnitConversion(unit: UserUnit): string {
  if (unit.to_base_multiplier === 1 && unit.symbol === unit.base_unit) {
    return 'Base unit';
  }

  const multiplier =
    Math.abs(unit.to_base_multiplier - Math.round(unit.to_base_multiplier)) < 0.01
      ? Math.round(unit.to_base_multiplier).toString()
      : unit.to_base_multiplier.toString();

  return `1 ${unit.symbol} = ${multiplier} ${unit.base_unit}`;
}
