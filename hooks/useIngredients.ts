import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import {
  createIngredient,
  deleteIngredient,
  fetchIngredient,
  fetchIngredients,
  updateIngredient,
  type IngredientInsertInput,
  type IngredientUpdateInput,
} from '@/lib/services/ingredients';

export function useIngredients() {
  return useQuery({
    queryKey: queryKeys.ingredients,
    queryFn: fetchIngredients,
  });
}

export function useIngredient(id?: string) {
  return useQuery({
    queryKey: queryKeys.ingredient(id ?? 'new'),
    queryFn: () => (id ? fetchIngredient(id) : Promise.resolve(null)),
    enabled: Boolean(id),
  });
}

export function useIngredientMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.ingredients });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['recipes'] });
  };

  const create = useMutation({
    mutationFn: (input: IngredientInsertInput) => createIngredient(input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: IngredientUpdateInput }) =>
      updateIngredient(id, input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: deleteIngredient,
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
