import { ActivityIndicator, Alert, View } from 'react-native';

import { ExpenseRow } from '@/components/finance/ExpenseRow';
import { PaySummaryCard } from '@/components/finance/PaySummaryCard';
import { PaySettingsModal } from '@/components/finance/PaySettingsModal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Text } from '@/components/ui/Text';
import { useFinance } from '@/hooks/useFinance';
import { formatErrorMessage } from '@/lib/errors';
import { useState } from 'react';

type FinanceOverviewTabProps = {
  onAddExpense: () => void;
  onEditExpense: (id: string) => void;
};

export function FinanceOverviewTab({ onAddExpense, onEditExpense }: FinanceOverviewTabProps) {
  const {
    settings,
    payPeriod,
    isLoading,
    isError,
    errorMessage,
    refetch,
    isSavingSettings,
    saveSettings,
  } = useFinance();
  const [payModalVisible, setPayModalVisible] = useState(false);

  const handleSavePaySettings = async (input: {
    pay_amount: number;
    next_pay_date: string | null;
  }) => {
    try {
      await saveSettings(input);
      setPayModalVisible(false);
    } catch (error) {
      Alert.alert('Could not save pay settings', formatErrorMessage(error, 'Please try again.'));
    }
  };

  if (isLoading) {
    return <ActivityIndicator className="mt-6" />;
  }

  if (isError) {
    return (
      <View className="gap-3">
        <Text variant="bodySecondary">
          {errorMessage ?? 'Could not load finance data. Please try again.'}
        </Text>
        <Button label="Retry" variant="secondary" onPress={() => refetch()} className="self-start" />
      </View>
    );
  }

  const hasPayDate = Boolean(settings?.next_pay_date);

  return (
    <View className="gap-4">
      <PaySummaryCard
        settings={settings}
        payPeriod={payPeriod}
        onPress={() => setPayModalVisible(true)}
      />

      <View className="flex-row items-center justify-between">
        <Text variant="label">Due before next pay</Text>
        <Button label="Add expense" variant="secondary" onPress={onAddExpense} className="px-3 py-1" />
      </View>

      {!hasPayDate ? (
        <EmptyState
          title="Set your pay date"
          description="Add your next pay date to see which bills are due before you get paid."
        />
      ) : payPeriod.dueBeforePay.length === 0 ? (
        <EmptyState
          title="No bills due"
          description="Nothing is scheduled between today and your next pay date."
        />
      ) : (
        <View className="gap-2">
          {payPeriod.dueBeforePay.map((item) => (
            <ExpenseRow
              key={`${item.expense.id}-${item.dueDate.toISOString()}`}
              expense={item.expense}
              dueDate={item.dueDate}
              showDueDate
              onPress={() => onEditExpense(item.expense.id)}
            />
          ))}
        </View>
      )}

      <PaySettingsModal
        visible={payModalVisible}
        settings={settings}
        isSubmitting={isSavingSettings}
        onSave={handleSavePaySettings}
        onCancel={() => setPayModalVisible(false)}
      />
    </View>
  );
}
