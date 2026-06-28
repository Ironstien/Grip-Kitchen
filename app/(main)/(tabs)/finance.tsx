import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { ExpenseFormModal } from '@/components/finance/ExpenseFormModal';
import { FinanceExpensesTab } from '@/components/finance/FinanceExpensesTab';
import { FinanceOverviewTab } from '@/components/finance/FinanceOverviewTab';
import { FinanceTabs, type FinanceTab } from '@/components/finance/FinanceTabs';
import { Heading, Text } from '@/components/ui/Text';
import { detailPaddingClass, pageHeaderMarginClass, pagePaddingClass } from '@/constants/theme';
import { useFinance } from '@/hooks/useFinance';
import { useResponsive } from '@/hooks/useResponsive';
import { formatErrorMessage } from '@/lib/errors';
import { useState } from 'react';

export default function FinanceScreen() {
  const { isDesktop } = useResponsive();
  const paddingClass = pagePaddingClass(isDesktop);
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [overviewExpenseModalVisible, setOverviewExpenseModalVisible] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const { expenses, isSavingExpense, addExpense, editExpense } = useFinance();

  const editingExpense = editingExpenseId
    ? (expenses.find((expense) => expense.id === editingExpenseId) ?? null)
    : null;

  const openAddExpenseFromOverview = () => {
    setEditingExpenseId(null);
    setOverviewExpenseModalVisible(true);
  };

  const openEditExpenseFromOverview = (id: string) => {
    setEditingExpenseId(id);
    setOverviewExpenseModalVisible(true);
  };

  const handleSaveOverviewExpense = async (values: Parameters<typeof addExpense>[0]) => {
    try {
      if (editingExpense) {
        await editExpense(editingExpense.id, values);
      } else {
        await addExpense(values);
      }
      setOverviewExpenseModalVisible(false);
      setEditingExpenseId(null);
    } catch (error) {
      Alert.alert(
        editingExpense ? 'Could not update expense' : 'Could not add expense',
        formatErrorMessage(error, 'Please try again.'),
      );
    }
  };

  const tabContent =
    activeTab === 'overview' ? (
      <FinanceOverviewTab
        onAddExpense={openAddExpenseFromOverview}
        onEditExpense={openEditExpenseFromOverview}
      />
    ) : (
      <FinanceExpensesTab />
    );

  const expenseModal = (
    <ExpenseFormModal
      visible={overviewExpenseModalVisible}
      expense={editingExpense}
      isSubmitting={isSavingExpense}
      onSave={handleSaveOverviewExpense}
      onCancel={() => {
        setOverviewExpenseModalVisible(false);
        setEditingExpenseId(null);
      }}
    />
  );

  if (isDesktop) {
    return (
      <>
        <ScrollView
          className="flex-1 bg-surface dark:bg-surface-dark"
          contentContainerClassName={`${detailPaddingClass(true)} max-w-2xl flex-grow pb-8`}>
          <View className={pageHeaderMarginClass(true)}>
            <Heading level={2}>Finance</Heading>
            <Text variant="caption" className="mt-0.5">
              Track recurring bills against your next fortnightly pay.
            </Text>
          </View>

          <FinanceTabs activeTab={activeTab} onChange={setActiveTab} />
          {tabContent}
        </ScrollView>
        {expenseModal}
      </>
    );
  }

  return (
    <>
      <KeyboardAvoidingView
        className="flex-1 bg-surface dark:bg-surface-dark"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className={`border-b border-border dark:border-border-dark ${paddingClass} pb-3`}>
          <View className={pageHeaderMarginClass(false)}>
            <Heading level={2}>Finance</Heading>
            <Text variant="caption" className="mt-0.5">
              Track recurring bills against your next fortnightly pay.
            </Text>
          </View>
          <FinanceTabs activeTab={activeTab} onChange={setActiveTab} />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName={`${paddingClass} pb-8`}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {tabContent}
        </ScrollView>
      </KeyboardAvoidingView>
      {expenseModal}
    </>
  );
}
