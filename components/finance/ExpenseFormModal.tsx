import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormField, OptionSelect } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { formatDisplayDate, parseAmountInput } from '@/lib/finance/format';
import {
  FREQUENCY_LABELS,
  WEEKDAY_LABELS,
  formatISODate,
  parseISODate,
} from '@/lib/finance/payPeriod';
import type { ExpenseFrequency, RecurringExpense } from '@/types/database';

export type ExpenseFormValues = {
  name: string;
  amount: number;
  frequency: ExpenseFrequency;
  due_day?: number | null;
  due_weekday?: number | null;
  anchor_date?: string | null;
  category?: string | null;
  is_active: boolean;
};

type ExpenseFormModalProps = {
  visible: boolean;
  expense?: RecurringExpense | null;
  isSubmitting: boolean;
  onSave: (values: ExpenseFormValues) => Promise<void>;
  onCancel: () => void;
};

const FREQUENCY_OPTIONS = Object.values(FREQUENCY_LABELS);

function frequencyFromLabel(label: string): ExpenseFrequency {
  const entry = Object.entries(FREQUENCY_LABELS).find(([, value]) => value === label);
  return (entry?.[0] as ExpenseFrequency) ?? 'monthly';
}

function frequencyToLabel(frequency: ExpenseFrequency): string {
  return FREQUENCY_LABELS[frequency];
}

export function ExpenseFormModal({
  visible,
  expense,
  isSubmitting,
  onSave,
  onCancel,
}: ExpenseFormModalProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequencyLabel, setFrequencyLabel] = useState(FREQUENCY_LABELS.monthly);
  const [dueDay, setDueDay] = useState('1');
  const [dueWeekdayLabel, setDueWeekdayLabel] = useState<string>(WEEKDAY_LABELS[1]);
  const [anchorDate, setAnchorDate] = useState<Date | null>(null);
  const [category, setCategory] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const frequency = frequencyFromLabel(frequencyLabel);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setName(expense?.name ?? '');
    setAmount(expense?.amount != null ? String(expense.amount) : '');
    setFrequencyLabel(frequencyToLabel(expense?.frequency ?? 'monthly'));
    setDueDay(expense?.due_day != null ? String(expense.due_day) : '1');
    setDueWeekdayLabel(
      expense?.due_weekday != null ? WEEKDAY_LABELS[expense.due_weekday] : WEEKDAY_LABELS[1],
    );
    setAnchorDate(expense?.anchor_date ? parseISODate(expense.anchor_date) : null);
    setCategory(expense?.category ?? '');
    setIsActive(expense?.is_active ?? true);
    setError(null);
    setShowDatePicker(false);
  }, [expense, visible]);

  const handleSave = async () => {
    const parsedAmount = parseAmountInput(amount);
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Enter an expense name.');
      return;
    }

    if (parsedAmount == null) {
      setError('Enter a valid amount.');
      return;
    }

    if (frequency === 'monthly') {
      const day = Number(dueDay);
      if (!Number.isInteger(day) || day < 1 || day > 31) {
        setError('Enter a due day between 1 and 31.');
        return;
      }
    }

    if ((frequency === 'fortnightly' || frequency === 'yearly') && !anchorDate) {
      setError('Choose an anchor due date.');
      return;
    }

    const dueWeekdayIndex = WEEKDAY_LABELS.indexOf(dueWeekdayLabel as (typeof WEEKDAY_LABELS)[number]);

    setError(null);
    await onSave({
      name: trimmedName,
      amount: parsedAmount,
      frequency,
      due_day: frequency === 'monthly' ? Number(dueDay) : null,
      due_weekday: frequency === 'weekly' ? dueWeekdayIndex : null,
      anchor_date:
        frequency === 'fortnightly' || frequency === 'yearly'
          ? anchorDate
            ? formatISODate(anchorDate)
            : null
          : null,
      category: category.trim() || null,
      is_active: isActive,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <View className="max-h-[90%] w-full max-w-md rounded-card border border-border bg-surface p-3 dark:border-border-dark dark:bg-surface-dark">
          <Text className="mb-1 text-base font-semibold">
            {expense ? 'Edit expense' : 'Add recurring expense'}
          </Text>

          <ScrollView
            className="max-h-[420px]"
            contentContainerClassName="gap-3 pb-2"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <FormField label="Name">
              <Input
                value={name}
                onChangeText={setName}
                placeholder="Rent, Netflix, Power..."
                editable={!isSubmitting}
              />
            </FormField>

            <FormField label="Amount (AUD)">
              <Input
                value={amount}
                onChangeText={setAmount}
                placeholder="120"
                keyboardType="decimal-pad"
                editable={!isSubmitting}
              />
            </FormField>

            <OptionSelect
              label="Frequency"
              value={frequencyLabel}
              options={FREQUENCY_OPTIONS}
              onChange={setFrequencyLabel}
            />

            {frequency === 'weekly' ? (
              <OptionSelect
                label="Due day"
                value={dueWeekdayLabel}
                options={[...WEEKDAY_LABELS]}
                onChange={setDueWeekdayLabel}
              />
            ) : null}

            {frequency === 'monthly' ? (
              <FormField label="Due day of month">
                <Input
                  value={dueDay}
                  onChangeText={setDueDay}
                  placeholder="15"
                  keyboardType="number-pad"
                  editable={!isSubmitting}
                />
              </FormField>
            ) : null}

            {frequency === 'fortnightly' || frequency === 'yearly' ? (
              <FormField label={frequency === 'yearly' ? 'Annual due date' : 'First due date'}>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  className="min-h-[32px] justify-center rounded-button border border-border px-2 dark:border-border-dark">
                  <Text>{anchorDate ? formatDisplayDate(anchorDate) : 'Select date'}</Text>
                </Pressable>
                {showDatePicker ? (
                  <DateTimePicker
                    value={anchorDate ?? new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, date) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (date) {
                        setAnchorDate(date);
                      }
                    }}
                  />
                ) : null}
              </FormField>
            ) : null}

            <FormField label="Category (optional)">
              <Input
                value={category}
                onChangeText={setCategory}
                placeholder="Housing, Subscriptions..."
                editable={!isSubmitting}
              />
            </FormField>

            {expense ? (
              <OptionSelect
                label="Status"
                value={isActive ? 'Active' : 'Paused'}
                options={['Active', 'Paused']}
                onChange={(value) => setIsActive(value === 'Active')}
              />
            ) : null}

            {error ? (
              <Text variant="caption" style={{ color: '#DC2626' }}>
                {error}
              </Text>
            ) : null}
          </ScrollView>

          <View className="mt-3 flex-row gap-2">
            <Button
              label="Cancel"
              variant="ghost"
              onPress={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            />
            <Button
              label={isSubmitting ? 'Saving...' : 'Save'}
              onPress={() => void handleSave()}
              disabled={isSubmitting}
              className="flex-1"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
