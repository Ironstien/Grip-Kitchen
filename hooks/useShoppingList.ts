import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import {
  archiveShoppingList,
  createShoppingList,
  createShoppingListFromMealPlan,
  createShoppingListItem,
  deleteShoppingList,
  deleteShoppingListItem,
  fetchShoppingListItems,
  fetchShoppingLists,
  getOrCreateDefaultShoppingList,
  updateShoppingListItem,
  updateShoppingListSession,
  type MealPlanShoppingLine,
  type ShoppingListInsertInput,
} from '@/lib/services/shoppingList';

export function useShoppingLists(status?: 'active' | 'archived') {
  return useQuery({
    queryKey: queryKeys.shoppingLists(status),
    queryFn: () => fetchShoppingLists(status),
  });
}

export function useShoppingListItems(listId?: string) {
  return useQuery({
    queryKey: queryKeys.shoppingList(listId ?? 'none'),
    queryFn: () => (listId ? fetchShoppingListItems(listId) : Promise.resolve([])),
    enabled: Boolean(listId),
  });
}

export function useShoppingListMutations(listId?: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['shoppingList'] });
    queryClient.invalidateQueries({ queryKey: ['shoppingLists'] });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
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
      input: Partial<Pick<ShoppingListInsertInput, 'target_quantity'>> & { is_purchased?: boolean };
    }) => updateShoppingListItem(id, input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: deleteShoppingListItem,
    onSuccess: invalidate,
  });

  const createList = useMutation({
    mutationFn: (name?: string) => createShoppingList(name),
    onSuccess: invalidate,
  });

  const renameList = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateShoppingListSession(id, { name }),
    onSuccess: invalidate,
  });

  const archiveList = useMutation({
    mutationFn: archiveShoppingList,
    onSuccess: invalidate,
  });

  const deleteList = useMutation({
    mutationFn: deleteShoppingList,
    onSuccess: invalidate,
  });

  const createFromMealPlan = useMutation({
    mutationFn: (input: { lines: MealPlanShoppingLine[]; name?: string; weekStart: string }) =>
      createShoppingListFromMealPlan(input.lines, {
        name: input.name,
        weekStart: input.weekStart,
      }),
    onSuccess: invalidate,
  });

  const ensureDefaultList = useMutation({
    mutationFn: getOrCreateDefaultShoppingList,
    onSuccess: invalidate,
  });

  return {
    listId,
    create,
    update,
    remove,
    createList,
    renameList,
    archiveList,
    deleteList,
    createFromMealPlan,
    ensureDefaultList,
  };
}

/** Backward-compatible hook: uses the most recent active list */
export function useShoppingList() {
  const { data: lists = [], isLoading: listsLoading } = useShoppingLists('active');
  const activeListId = lists[0]?.id;
  const itemsQuery = useShoppingListItems(activeListId);

  return {
    ...itemsQuery,
    isLoading: listsLoading || itemsQuery.isLoading,
    activeListId,
    lists,
  };
}
