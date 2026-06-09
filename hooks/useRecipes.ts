import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { scaleIngredientQuantities } from '@/lib/recipeScaling';
import {
  createRecipe,
  deleteRecipe,
  fetchRecipe,
  fetchRecipes,
  updateRecipe,
  uploadRecipeHeroImage,
  type RecipeFilters,
  type RecipeInsertInput,
  type RecipeUpdateInput,
} from '@/lib/services/recipes';

export function useRecipes(filters: RecipeFilters = {}) {
  return useQuery({
    queryKey: queryKeys.recipes(filters),
    queryFn: () => fetchRecipes(filters),
  });
}

export function useRecipe(id?: string) {
  return useQuery({
    queryKey: queryKeys.recipe(id ?? 'new'),
    queryFn: () => (id ? fetchRecipe(id) : Promise.resolve(null)),
    enabled: Boolean(id),
  });
}

export function useRecipeScaling(
  baseServings: number,
  initialServings = baseServings,
) {
  const [targetServings, setTargetServings] = useState(initialServings);

  const scaleIngredients = useMemo(
    () =>
      <T extends { required_quantity: number }>(ingredients: T[]) =>
        scaleIngredientQuantities(ingredients, baseServings, targetServings),
    [baseServings, targetServings],
  );

  return {
    targetServings,
    setTargetServings,
    scaleIngredients,
  };
}

export function useRecipeMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['recipes'] });
  };

  const create = useMutation({
    mutationFn: (input: RecipeInsertInput) => createRecipe(input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: RecipeUpdateInput }) =>
      updateRecipe(id, input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: deleteRecipe,
    onSuccess: invalidate,
  });

  const uploadHeroImage = useMutation({
    mutationFn: ({
      recipeId,
      uri,
      mimeType,
    }: {
      recipeId: string;
      uri: string;
      mimeType?: string;
    }) => uploadRecipeHeroImage(recipeId, uri, mimeType),
    onSuccess: invalidate,
  });

  return { create, update, remove, uploadHeroImage };
}
