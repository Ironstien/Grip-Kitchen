import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import {
  createInventoryItem,
  deleteInventoryItem,
  deleteInventoryItems,
  fetchInventory,
  fetchInventoryItem,
  updateInventoryItem,
  type PantryStockInsertInput,
  type PantryStockUpdateInput,
} from '@/lib/services/inventory';

export function useInventory(locationId?: string | null) {
  return useQuery({
    queryKey: queryKeys.inventory(locationId),
    queryFn: () => fetchInventory(locationId),
  });
}

export function useInventoryItem(id?: string) {
  return useQuery({
    queryKey: queryKeys.inventoryItem(id ?? 'new'),
    queryFn: () => (id ? fetchInventoryItem(id) : Promise.resolve(null)),
    enabled: Boolean(id),
  });
}

export function useInventoryMutations(locationId?: string | null) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  };

  const create = useMutation({
    mutationFn: (input: PantryStockInsertInput) => createInventoryItem(input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: PantryStockUpdateInput }) =>
      updateInventoryItem(id, input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: deleteInventoryItem,
    onSuccess: invalidate,
  });

  const removeMany = useMutation({
    mutationFn: deleteInventoryItems,
    onSuccess: invalidate,
  });

  return { create, update, remove, removeMany, locationId };
}
