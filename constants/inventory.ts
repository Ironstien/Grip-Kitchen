/** Default categories seeded into Master Category List on first use. */
export const DEFAULT_USER_CATEGORIES = [
  'Produce',
  'Pantry',
  'Dairy & Eggs',
  'Meat & Seafood',
  'Frozen',
  'Bakery',
  'Beverages',
  'Snacks',
  'Deli',
  'Canned & Jarred',
  'Condiments & Sauces',
  'Spices & Seasonings',
  'Baking',
  'International',
  'Health & Dietary',
  'Other',
] as const;

/** @deprecated Use Master Category List via useUserCategories() */
export const INVENTORY_CATEGORIES = DEFAULT_USER_CATEGORIES;

export type InventoryCategory = (typeof DEFAULT_USER_CATEGORIES)[number];

export const METRIC_UNITS = ['g', 'kg', 'ml', 'L', 'each'] as const;

export type MetricUnit = (typeof METRIC_UNITS)[number];

export type UnitFamily = 'mass' | 'volume' | 'count';

export type DefaultUserUnitSeed = {
  symbol: string;
  label: string;
  family: UnitFamily;
  base_unit: string;
  to_base_multiplier: number;
};

/** Australian cooking and grocery units with metric conversion rules. */
export const DEFAULT_USER_UNITS: DefaultUserUnitSeed[] = [
  { symbol: 'g', label: 'Gram', family: 'mass', base_unit: 'g', to_base_multiplier: 1 },
  { symbol: 'kg', label: 'Kilogram', family: 'mass', base_unit: 'g', to_base_multiplier: 1000 },
  { symbol: 'ml', label: 'Millilitre', family: 'volume', base_unit: 'ml', to_base_multiplier: 1 },
  { symbol: 'L', label: 'Litre', family: 'volume', base_unit: 'ml', to_base_multiplier: 1000 },
  { symbol: 'cup', label: 'Cup (250 ml)', family: 'volume', base_unit: 'ml', to_base_multiplier: 250 },
  { symbol: 'tbsp', label: 'Tablespoon (20 ml)', family: 'volume', base_unit: 'ml', to_base_multiplier: 20 },
  { symbol: 'tsp', label: 'Teaspoon (5 ml)', family: 'volume', base_unit: 'ml', to_base_multiplier: 5 },
  { symbol: 'each', label: 'Each', family: 'count', base_unit: 'each', to_base_multiplier: 1 },
  { symbol: 'bunch', label: 'Bunch', family: 'count', base_unit: 'each', to_base_multiplier: 1 },
  { symbol: 'clove', label: 'Clove', family: 'count', base_unit: 'each', to_base_multiplier: 1 },
  { symbol: 'slice', label: 'Slice', family: 'count', base_unit: 'each', to_base_multiplier: 1 },
  { symbol: 'head', label: 'Head', family: 'count', base_unit: 'each', to_base_multiplier: 1 },
  { symbol: 'punnet', label: 'Punnet', family: 'count', base_unit: 'each', to_base_multiplier: 1 },
  { symbol: 'pack', label: 'Pack', family: 'count', base_unit: 'each', to_base_multiplier: 1 },
  { symbol: 'bottle', label: 'Bottle', family: 'count', base_unit: 'each', to_base_multiplier: 1 },
  { symbol: 'can', label: 'Can', family: 'count', base_unit: 'each', to_base_multiplier: 1 },
  { symbol: 'box', label: 'Box', family: 'count', base_unit: 'each', to_base_multiplier: 1 },
  { symbol: 'bag', label: 'Bag', family: 'count', base_unit: 'each', to_base_multiplier: 1 },
];

export const UNIT_FAMILY_LABELS: Record<UnitFamily, string> = {
  mass: 'Mass',
  volume: 'Volume',
  count: 'Count',
};

export const DEFAULT_STORAGE_LOCATIONS = ['Pantry', 'Fridge', 'Freezer'] as const;

export const EXPIRY_WARNING_DAYS = 3;
