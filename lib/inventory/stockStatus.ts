import type { PantryItem } from '@/lib/inventory/pantry';

export type StockLevel = 'ok' | 'low' | 'out';

export function getStockLevel(
  item: Pick<PantryItem, 'quantity' | 'min_threshold'>,
): StockLevel {
  if (item.quantity <= 0) {
    return 'out';
  }

  if (item.min_threshold > 0 && item.quantity <= item.min_threshold) {
    return 'low';
  }

  return 'ok';
}

export const stockLevelBorderClasses: Record<StockLevel, string> = {
  ok: '',
  low: 'border-l-4 border-l-status-warning',
  out: 'border-l-4 border-l-status-danger',
};

export const stockLevelQtyClasses: Record<StockLevel, string> = {
  ok: 'text-text dark:text-text-dark',
  low: 'text-status-warning',
  out: 'text-status-danger',
};
