import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import {
  createUserCategory,
  deleteUserCategory,
  ensureDefaultUserCategories,
  renameUserCategory,
} from '@/lib/services/userCategories';

export function useUserCategories() {
  return useQuery({
    queryKey: queryKeys.userCategories,
    queryFn: ensureDefaultUserCategories,
  });
}

export function useUserCategoryMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.userCategories });
  };

  const create = useMutation({
    mutationFn: (name: string) => createUserCategory(name),
    onSuccess: invalidate,
  });

  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameUserCategory(id, name),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: deleteUserCategory,
    onSuccess: invalidate,
  });

  return { create, rename, remove };
}
