import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import {
  clearMealPlanSlot,
  deleteMealPlanEntry,
  fetchMealPlanRange,
  updateMealPlanServings,
  upsertMealPlanEntry,
  type MealPlanUpsertInput,
} from '@/lib/services/mealPlan';

export function useMealPlanRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: queryKeys.mealPlan(startDate, endDate),
    queryFn: () => fetchMealPlanRange(startDate, endDate),
  });
}

export function useMealPlanMutations(startDate: string, endDate: string) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.mealPlan(startDate, endDate);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['mealPlan'] });
  };

  const upsert = useMutation({
    mutationFn: (input: MealPlanUpsertInput) => upsertMealPlanEntry(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      invalidate();
    },
  });

  const updateServings = useMutation({
    mutationFn: ({ id, targetServings }: { id: string; targetServings: number }) =>
      updateMealPlanServings(id, targetServings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      invalidate();
    },
  });

  const clearSlot = useMutation({
    mutationFn: ({ plannedDate, mealLabel }: { plannedDate: string; mealLabel: string }) =>
      clearMealPlanSlot(plannedDate, mealLabel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: deleteMealPlanEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      invalidate();
    },
  });

  return { upsert, updateServings, clearSlot, remove };
}
