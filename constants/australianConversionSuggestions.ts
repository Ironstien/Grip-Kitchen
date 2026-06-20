export type ConversionSuggestion = {
  label: string;
  from_unit: string;
  to_unit: string;
  factor: number;
};

/** Standard Australian cooking conversions (metric cup, tbsp, tsp). */
export const AUSTRALIAN_CONVERSION_SUGGESTIONS: ConversionSuggestion[] = [
  { label: '1 cup = 250 ml', from_unit: 'cup', to_unit: 'ml', factor: 250 },
  { label: '1 tbsp = 20 ml', from_unit: 'tbsp', to_unit: 'ml', factor: 20 },
  { label: '1 tsp = 5 ml', from_unit: 'tsp', to_unit: 'ml', factor: 5 },
  { label: '1 tbsp = 4 tsp', from_unit: 'tbsp', to_unit: 'tsp', factor: 4 },
  { label: '1 L = 1000 ml', from_unit: 'L', to_unit: 'ml', factor: 1000 },
  { label: '1 L = 4 cups', from_unit: 'L', to_unit: 'cup', factor: 4 },
  { label: '1 kg = 1000 g', from_unit: 'kg', to_unit: 'g', factor: 1000 },
];
