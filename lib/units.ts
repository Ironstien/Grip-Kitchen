import type { UnitFamily } from '@/constants/inventory';
import type { UserUnit } from '@/types/database';

export type { UnitFamily };

type UnitDefinition = {
  family: UnitFamily;
  baseUnit: string;
  toBaseMultiplier: number;
  aliases: string[];
  symbol: string;
};

const BUILTIN_ALIASES: UnitDefinition[] = [
  { family: 'mass', baseUnit: 'g', toBaseMultiplier: 1, aliases: ['gram', 'grams'], symbol: 'g' },
  { family: 'mass', baseUnit: 'g', toBaseMultiplier: 1000, aliases: ['kilogram', 'kilograms'], symbol: 'kg' },
  {
    family: 'volume',
    baseUnit: 'ml',
    toBaseMultiplier: 1,
    aliases: ['milliliter', 'milliliters', 'millilitre', 'millilitres'],
    symbol: 'ml',
  },
  {
    family: 'volume',
    baseUnit: 'ml',
    toBaseMultiplier: 1000,
    aliases: ['l', 'liter', 'liters', 'litre', 'litres'],
    symbol: 'L',
  },
  {
    family: 'count',
    baseUnit: 'each',
    toBaseMultiplier: 1,
    aliases: ['ea', 'unit', 'units', 'piece', 'pieces', 'item', 'items'],
    symbol: 'each',
  },
];

let registeredUserUnits: UnitDefinition[] = [];

export function registerUserUnits(units: UserUnit[]): void {
  registeredUserUnits = units.map((unit) => ({
    family: unit.family,
    baseUnit: unit.base_unit,
    toBaseMultiplier: unit.to_base_multiplier,
    aliases: [unit.symbol.toLowerCase()],
    symbol: unit.symbol,
  }));
}

function normalizeUnit(unit: string): string {
  return unit.trim().toLowerCase();
}

export function normalizeUnitSymbol(unit: string): string {
  return normalizeUnit(unit);
}

function getAllDefinitions(): UnitDefinition[] {
  return [...registeredUserUnits, ...BUILTIN_ALIASES];
}

export function getUnitDefinition(unit: string): UnitDefinition | null {
  const normalized = normalizeUnit(unit);
  return (
    getAllDefinitions().find(
      (definition) =>
        normalizeUnit(definition.symbol) === normalized ||
        definition.aliases.some((alias) => alias === normalized),
    ) ?? null
  );
}

export function resolveUnitSymbol(unit: string): string | null {
  const trimmed = unit.trim();
  if (!trimmed) {
    return null;
  }

  const definition = getUnitDefinition(trimmed);
  if (definition) {
    return definition.symbol;
  }

  const normalized = normalizeUnit(trimmed);
  const registered = registeredUserUnits.find(
    (entry) => normalizeUnit(entry.symbol) === normalized,
  );

  return registered?.symbol ?? null;
}

export function resolveMasterUnitSymbol(
  unit: string,
  masterUnits: Array<{ symbol: string }>,
): string | null {
  const normalized = normalizeUnit(unit);
  if (!normalized) {
    return null;
  }

  const match = masterUnits.find((entry) => normalizeUnit(entry.symbol) === normalized);
  return match?.symbol ?? null;
}

export function isMasterUnitSymbol(
  unit: string,
  masterUnits: Array<{ symbol: string }>,
): boolean {
  return resolveMasterUnitSymbol(unit, masterUnits) !== null;
}

export function getRegisteredUnitSymbols(): string[] {
  return registeredUserUnits.map((unit) => unit.symbol);
}

export function getUnitFamily(unit: string): UnitFamily | 'unknown' {
  return getUnitDefinition(unit)?.family ?? 'unknown';
}

export function getUnitsInSameFamily(unit: string): string[] {
  const definition = getUnitDefinition(unit);
  if (!definition) {
    return [unit];
  }

  const symbols = new Set<string>();
  for (const entry of getAllDefinitions()) {
    if (entry.family === definition.family) {
      symbols.add(entry.symbol);
    }
  }

  return Array.from(symbols);
}

export function canConvertUnits(fromUnit: string, toUnit: string): boolean {
  const from = getUnitDefinition(fromUnit);
  const to = getUnitDefinition(toUnit);

  if (!from || !to) {
    return normalizeUnit(fromUnit) === normalizeUnit(toUnit);
  }

  return from.family === to.family;
}

export function convertQuantity(
  quantity: number,
  fromUnit: string,
  toUnit: string,
): { quantity: number; converted: boolean } {
  if (!Number.isFinite(quantity)) {
    return { quantity: 0, converted: false };
  }

  const normalizedFrom = normalizeUnit(fromUnit);
  const normalizedTo = normalizeUnit(toUnit);

  if (normalizedFrom === normalizedTo) {
    return { quantity, converted: true };
  }

  const from = getUnitDefinition(fromUnit);
  const to = getUnitDefinition(toUnit);

  if (!from || !to || from.family !== to.family) {
    return { quantity, converted: false };
  }

  const baseQuantity = quantity * from.toBaseMultiplier;
  const convertedQuantity = baseQuantity / to.toBaseMultiplier;

  return { quantity: convertedQuantity, converted: true };
}

export function subtractQuantities(
  inventoryQuantity: number,
  inventoryUnit: string,
  requiredQuantity: number,
  requiredUnit: string,
): { quantity: number; converted: boolean } {
  const { quantity: requiredInInventoryUnit, converted } = convertQuantity(
    requiredQuantity,
    requiredUnit,
    inventoryUnit,
  );

  if (!converted) {
    return { quantity: inventoryQuantity, converted: false };
  }

  return {
    quantity: Math.max(0, inventoryQuantity - requiredInInventoryUnit),
    converted: true,
  };
}

export function isKnownUnit(unit: string): boolean {
  if (getUnitDefinition(unit) !== null) {
    return true;
  }

  return registeredUserUnits.some(
    (definition) => normalizeUnit(definition.symbol) === normalizeUnit(unit),
  );
}

export function formatQuantity(quantity: number, unit: string): string {
  const rounded =
    Math.abs(quantity - Math.round(quantity)) < 0.01
      ? Math.round(quantity).toString()
      : quantity.toFixed(2).replace(/\.?0+$/, '');

  return `${rounded} ${unit}`;
}

