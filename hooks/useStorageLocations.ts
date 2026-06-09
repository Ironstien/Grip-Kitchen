import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import {
  createStorageLocation,
  deleteStorageLocation,
  ensureDefaultStorageLocations,
  fetchStorageLocations,
  renameStorageLocation,
  reorderStorageLocations,
} from '@/lib/services/storageLocations';

export function useStorageLocations() {
  return useQuery({
    queryKey: queryKeys.storageLocations,
    queryFn: ensureDefaultStorageLocations,
  });
}

export function useStorageLocationMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.storageLocations });

  const create = useMutation({
    mutationFn: createStorageLocation,
    onSuccess: invalidate,
  });

  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameStorageLocation(id, name),
    onSuccess: invalidate,
  });

  const reorder = useMutation({
    mutationFn: reorderStorageLocations,
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: deleteStorageLocation,
    onSuccess: invalidate,
  });

  return { create, rename, reorder, remove, refresh: () => fetchStorageLocations() };
}
