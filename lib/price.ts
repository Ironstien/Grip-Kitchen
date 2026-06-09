export function formatPricePerUnit(price: number, unit: string): string {
  if (!Number.isFinite(price)) {
    return `0 per ${unit}`;
  }

  const rounded =
    Math.abs(price - Math.round(price)) < 0.01
      ? Math.round(price).toString()
      : price.toFixed(2).replace(/\.?0+$/, '');

  return `${rounded} per ${unit}`;
}

export function parsePricePerUnit(
  input: string,
  fallbackUnit = 'each',
): { price: number; unit: string } | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(?:per|\/)\s*(.+)$/i);
  if (match) {
    const price = Number(match[1]);
    const unit = match[2].trim();
    if (Number.isNaN(price) || price < 0 || !unit) {
      return null;
    }
    return { price, unit };
  }

  const price = Number(trimmed);
  if (Number.isNaN(price) || price < 0) {
    return null;
  }

  return { price, unit: fallbackUnit };
}
