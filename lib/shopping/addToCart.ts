export function suggestBuyQuantity(
  item: Pick<{ quantity: number; min_threshold: number }, 'quantity' | 'min_threshold'>,
): number {
  if (item.min_threshold > 0 && item.quantity < item.min_threshold) {
    return Math.max(1, item.min_threshold - item.quantity);
  }

  if (item.quantity <= 0) {
    return 1;
  }

  return 1;
}
