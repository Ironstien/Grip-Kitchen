import type { PantryItem } from '@/lib/inventory/pantry';

export type PantrySortMode = 'shelf' | 'category' | 'alpha';

export const PANTRY_SORT_LABELS: Record<PantrySortMode, string> = {
  shelf: 'Shelf order',
  category: 'Category',
  alpha: 'A–Z',
};

export function sortPantryItems(items: PantryItem[], mode: PantrySortMode): PantryItem[] {
  const copy = [...items];

  switch (mode) {
    case 'shelf':
      return copy.sort((a, b) => {
        const orderDiff = a.shelf_sort_order - b.shelf_sort_order;
        if (orderDiff !== 0) {
          return orderDiff;
        }
        return a.name.localeCompare(b.name);
      });
    case 'category':
      return copy.sort((a, b) => {
        const categoryDiff = a.category.localeCompare(b.category);
        if (categoryDiff !== 0) {
          return categoryDiff;
        }
        return a.name.localeCompare(b.name);
      });
    case 'alpha':
      return copy.sort((a, b) => a.name.localeCompare(b.name));
  }
}
