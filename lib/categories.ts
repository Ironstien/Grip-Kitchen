import type { UserCategory } from '@/types/database';

export function resolveMasterCategoryName(
  name: string,
  categories: Array<Pick<UserCategory, 'name'>>,
): string | null {
  const normalized = name.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const match = categories.find((category) => category.name.trim().toLowerCase() === normalized);
  return match?.name ?? null;
}

export function isMasterCategoryName(
  name: string,
  categories: Array<Pick<UserCategory, 'name'>>,
): boolean {
  return resolveMasterCategoryName(name, categories) !== null;
}
