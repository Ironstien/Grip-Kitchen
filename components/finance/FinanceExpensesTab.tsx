import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';

import { ExpenseFormModal } from '@/components/finance/ExpenseFormModal';
import { ExpenseRow } from '@/components/finance/ExpenseRow';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Form';
import { EmptyState } from '@/components/ui/EmptyState';
import { Text } from '@/components/ui/Text';
import { useFinance } from '@/hooks/useFinance';
import { formatErrorMessage } from '@/lib/errors';
import type { RecurringExpense } from '@/types/database';

export function FinanceExpensesTab() {
  const {
    expenses,
    isLoading,
    isError,
    errorMessage,
    refetch,
    isSavingExpense,
    isDeletingExpense,
    addExpense,
    editExpense,
    removeExpense,
  } = useFinance();

  const [formVisible, setFormVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<RecurringExpense | null>(null);

  const openCreate = () => {
    setEditingExpense(null);
    setFormVisible(true);
  };

  const openEdit = (expense: RecurringExpense) => {
    setEditingExpense(expense);
    setFormVisible(true);
  };

  const handleSave = async (values: Parameters<typeof addExpense>[0]) => {
    try {
      if (editingExpense) {
        await editExpense(editingExpense.id, values);
      } else {
        await addExpense(values);
      }
      setFormVisible(false);
      setEditingExpense(null);
    } catch (error) {
      Alert.alert(
        editingExpense ? 'Could not update expense' : 'Could not add expense',
        formatErrorMessage(error, 'Please try again.'),
      );
    }
  };

  const handleDelete = () => {
    if (!deletingExpense) {
      return;
    }

    removeExpense(deletingExpense.id);
    setDeletingExpense(null);
  };

  if (isLoading) {
    return <ActivityIndicator className="mt-6" />;
  }

  if (isError) {
    return (
      <View className="gap-3">
        <Text variant="bodySecondary">
          {errorMessage ?? 'Could not load expenses. Please try again.'}
        </Text>
        <Button label="Retry" variant="secondary" onPress={() => refetch()} className="self-start" />
      </View>
    );
  }

  const activeExpenses = expenses.filter((expense) => expense.is_active);
  const pausedExpenses = expenses.filter((expense) => !expense.is_active);

  return (
    <View className="flex-1">
      <View className="mb-3 flex-row items-center justify-between">
        <Text variant="label">All recurring expenses</Text>
        <Button label="Add expense" onPress={openCreate} className="px-3 py-1" />
      </View>

      {expenses.length === 0 ? (
        <EmptyState
          title="No expenses yet"
          description="Add rent, subscriptions, utilities, and other recurring bills."
        />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 pb-4"
          showsVerticalScrollIndicator={false}>
          {activeExpenses.length > 0 ? (
            <View className="gap-2">
              <Text variant="caption">Active ({activeExpenses.length})</Text>
              {activeExpenses.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  onPress={() => openEdit(expense)}
                  onDelete={() => setDeletingExpense(expense)}
                />
              ))}
            </View>
          ) : null}

          {pausedExpenses.length > 0 ? (
            <View className="gap-2">
              <Text variant="caption">Paused ({pausedExpenses.length})</Text>
              {pausedExpenses.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  muted
                  onPress={() => openEdit(expense)}
                  onDelete={() => setDeletingExpense(expense)}
                />
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}

      <ExpenseFormModal
        visible={formVisible}
        expense={editingExpense}
        isSubmitting={isSavingExpense}
        onSave={handleSave}
        onCancel={() => {
          setFormVisible(false);
          setEditingExpense(null);
        }}
      />

      <ConfirmModal
        visible={Boolean(deletingExpense)}
        title="Delete expense?"
        message={`Remove "${deletingExpense?.name ?? 'this expense'}" from your recurring list.`}
        confirmLabel={isDeletingExpense ? 'Deleting...' : 'Delete'}
        onConfirm={handleDelete}
        onCancel={() => setDeletingExpense(null)}
      />
    </View>
  );
}
