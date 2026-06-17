import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import {
  createShoppingListItem,
  deleteShoppingListItem,
  fetchShoppingList,
  updateShoppingListItem,
  type ShoppingListInsertInput,
} from '@/lib/services/shoppingList';

export function useShoppingList() {
  return useQuery({
    queryKey: queryKeys.shoppingList,
    queryFn: fetchShoppingList,
  });
}

export function useShoppingListMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.shoppingList });
  };

  const create = useMutation({
    mutationFn: (input: ShoppingListInsertInput) => createShoppingListItem(input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<ShoppingListInsertInput> & { is_purchased?: boolean };
    }) => updateShoppingListItem(id, input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: deleteShoppingListItem,
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
