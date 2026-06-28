import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { computePayPeriodSummary } from '@/lib/finance/payPeriod';
import { queryKeys } from '@/lib/queryKeys';
import {
  createRecurringExpense,
  deleteRecurringExpense,
  fetchFinanceSettings,
  fetchRecurringExpenses,
  seedStarterExpenses,
  setRecurringExpenseActive,
  updateRecurringExpense,
  upsertFinanceSettings,
  type FinanceSettingsInput,
  type RecurringExpenseInput,
} from '@/lib/services/finance';
import { supabase } from '@/lib/supabase';

/** Call once on the Finance screen — not inside child tabs that also use useFinance(). */
export function useFinanceRealtimeSync() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!session) {
      return;
    }

    const invalidateSettings = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.financeSettings });
    };

    const invalidateExpenses = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.recurringExpenses });
    };

    const settingsChannel = supabase
      .channel('shared-finance-settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'finance_settings' },
        invalidateSettings,
      )
      .subscribe();

    const expensesChannel = supabase
      .channel('shared-finance-expenses')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recurring_expenses' },
        invalidateExpenses,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(settingsChannel);
      void supabase.removeChannel(expensesChannel);
    };
  }, [queryClient, session]);
}

/** Seeds household starter bills once per session when they are missing. */
export function useFinanceStarterSeed() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!session) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const existing = await fetchRecurringExpenses();
        if (cancelled) {
          return;
        }

        const added = await seedStarterExpenses(existing);
        if (added > 0) {
          void queryClient.invalidateQueries({ queryKey: queryKeys.recurringExpenses });
        }
      } catch {
        // Non-fatal — user can add expenses manually.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [queryClient, session]);
}

export function useFinance() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const invalidateSettings = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.financeSettings });
  }, [queryClient]);

  const invalidateExpenses = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.recurringExpenses });
  }, [queryClient]);

  const settingsQuery = useQuery({
    queryKey: queryKeys.financeSettings,
    queryFn: fetchFinanceSettings,
    enabled: Boolean(session),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const expensesQuery = useQuery({
    queryKey: queryKeys.recurringExpenses,
    queryFn: fetchRecurringExpenses,
    enabled: Boolean(session),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const saveSettingsMutation = useMutation({
    mutationFn: upsertFinanceSettings,
    onSuccess: invalidateSettings,
  });

  const createExpenseMutation = useMutation({
    mutationFn: createRecurringExpense,
    onSuccess: invalidateExpenses,
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: RecurringExpenseInput }) =>
      updateRecurringExpense(id, input),
    onSuccess: invalidateExpenses,
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: deleteRecurringExpense,
    onSuccess: invalidateExpenses,
  });

  const toggleExpenseMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setRecurringExpenseActive(id, isActive),
    onSuccess: invalidateExpenses,
  });

  const settings = settingsQuery.data ?? null;
  const expenses = expensesQuery.data ?? [];

  const payPeriod = useMemo(
    () =>
      computePayPeriodSummary(
        settings?.pay_amount ?? 0,
        settings?.next_pay_date ?? null,
        expenses,
      ),
    [expenses, settings?.next_pay_date, settings?.pay_amount],
  );

  const saveSettings = useCallback(
    async (input: FinanceSettingsInput) => {
      await saveSettingsMutation.mutateAsync(input);
      return true;
    },
    [saveSettingsMutation],
  );

  const addExpense = useCallback(
    async (input: RecurringExpenseInput) => {
      await createExpenseMutation.mutateAsync(input);
      return true;
    },
    [createExpenseMutation],
  );

  const editExpense = useCallback(
    async (id: string, input: RecurringExpenseInput) => {
      await updateExpenseMutation.mutateAsync({ id, input });
      return true;
    },
    [updateExpenseMutation],
  );

  const removeExpense = useCallback(
    (id: string) => {
      deleteExpenseMutation.mutate(id);
    },
    [deleteExpenseMutation],
  );

  const toggleExpense = useCallback(
    (id: string, isActive: boolean) => {
      toggleExpenseMutation.mutate({ id, isActive });
    },
    [toggleExpenseMutation],
  );

  return {
    settings,
    expenses,
    payPeriod,
    isLoading: settingsQuery.isLoading || expensesQuery.isLoading,
    isRefetching: settingsQuery.isRefetching || expensesQuery.isRefetching,
    isError: settingsQuery.isError || expensesQuery.isError,
    errorMessage:
      (settingsQuery.error instanceof Error ? settingsQuery.error.message : null) ??
      (expensesQuery.error instanceof Error ? expensesQuery.error.message : null),
    refetch: () => {
      void settingsQuery.refetch();
      void expensesQuery.refetch();
    },
    isSavingSettings: saveSettingsMutation.isPending,
    isSavingExpense:
      createExpenseMutation.isPending ||
      updateExpenseMutation.isPending ||
      toggleExpenseMutation.isPending,
    isDeletingExpense: deleteExpenseMutation.isPending,
    saveSettings,
    addExpense,
    editExpense,
    removeExpense,
    toggleExpense,
  };
}
