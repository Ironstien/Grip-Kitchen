export const queryKeys = {
  userUnits: ['userUnits'] as const,
  userCategories: ['userCategories'] as const,
  ingredients: ['ingredients'] as const,
  ingredient: (id: string) => ['ingredients', id] as const,
  storageLocations: ['storageLocations'] as const,
  inventory: (locationId?: string | null) => ['inventory', locationId ?? 'all'] as const,
  inventoryItem: (id: string) => ['inventory', 'item', id] as const,
  shoppingList: ['shoppingList'] as const,
  recipes: (filters?: Record<string, unknown>) => ['recipes', filters ?? {}] as const,
  recipe: (id: string) => ['recipes', id] as const,
};
