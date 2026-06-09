export const DIETARY_TAG_PRESETS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Keto',
  'Low-Carb',
  'Nut-Free',
] as const;

export type DietaryTagPreset = (typeof DIETARY_TAG_PRESETS)[number];

export const RECIPE_TIME_FILTERS = [
  { label: 'Any time', maxMinutes: null },
  { label: 'Under 15 min', maxMinutes: 15 },
  { label: 'Under 30 min', maxMinutes: 30 },
  { label: 'Under 60 min', maxMinutes: 60 },
] as const;
