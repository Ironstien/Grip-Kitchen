import { useMemo } from 'react';

import { useRecipes } from '@/hooks/useRecipes';

export function useAllDietaryTags() {
  const { data: recipes = [], isLoading } = useRecipes();

  const tags = useMemo(() => {
    const unique = new Set<string>();

    for (const recipe of recipes) {
      for (const tag of recipe.dietary_tags) {
        const trimmed = tag.trim();
        if (trimmed) {
          unique.add(trimmed);
        }
      }
    }

    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [recipes]);

  return { tags, isLoading };
}

export function mergeDietaryTags(existing: string[], additional: string[]): string[] {
  const unique = new Set([...existing, ...additional.map((tag) => tag.trim()).filter(Boolean)]);
  return Array.from(unique).sort((a, b) => a.localeCompare(b));
}
