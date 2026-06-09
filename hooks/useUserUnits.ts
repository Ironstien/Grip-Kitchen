import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import {
  createUserUnit,
  deleteUserUnit,
  ensureDefaultUserUnits,
  fetchUserUnits,
  updateUserUnit,
  type UserUnitInsertInput,
  type UserUnitUpdateInput,
} from '@/lib/services/userUnits';

export function useUserUnits() {
  return useQuery({
    queryKey: queryKeys.userUnits,
    queryFn: ensureDefaultUserUnits,
  });
}

export function useUserUnitMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.userUnits });

  const create = useMutation({
    mutationFn: (input: UserUnitInsertInput) => createUserUnit(input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UserUnitUpdateInput }) =>
      updateUserUnit(id, input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: deleteUserUnit,
    onSuccess: invalidate,
  });

  return { create, update, remove, refresh: () => fetchUserUnits() };
}
