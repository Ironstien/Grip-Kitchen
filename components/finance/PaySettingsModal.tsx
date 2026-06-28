import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { formatDisplayDate, parseAmountInput } from '@/lib/finance/format';
import { formatISODate, parseISODate } from '@/lib/finance/payPeriod';
import type { FinanceSettings } from '@/types/database';

type PaySettingsModalProps = {
  visible: boolean;
  settings: FinanceSettings | null;
  isSubmitting: boolean;
  onSave: (input: { pay_amount: number; next_pay_date: string | null }) => Promise<void>;
  onCancel: () => void;
};

function DateField({
  value,
  onChange,
  disabled,
}: {
  value: Date | null;
  onChange: (date: Date) => void;
  disabled?: boolean;
}) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const isoValue = value ? formatISODate(value) : '';

  if (Platform.OS === 'web') {
    return (
      <Input
        value={isoValue}
        onChangeText={(text) => {
          if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
            onChange(parseISODate(text));
          }
        }}
        placeholder="YYYY-MM-DD"
        editable={!disabled}
        // @ts-expect-error web-only date input
        type="date"
      />
    );
  }

  return (
    <>
      <Pressable
        onPress={() => !disabled && setShowDatePicker(true)}
        className="min-h-[32px] justify-center rounded-button border border-border px-2 dark:border-border-dark">
        <Text>{value ? formatDisplayDate(value) : 'Select date'}</Text>
      </Pressable>
      {showDatePicker ? (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (date) {
              onChange(date);
            }
          }}
        />
      ) : null}
    </>
  );
}

export function PaySettingsModal({
  visible,
  settings,
  isSubmitting,
  onSave,
  onCancel,
}: PaySettingsModalProps) {
  const [payAmount, setPayAmount] = useState('');
  const [nextPayDate, setNextPayDate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setPayAmount(settings?.pay_amount != null ? String(settings.pay_amount) : '');
    setNextPayDate(settings?.next_pay_date ? parseISODate(settings.next_pay_date) : null);
    setError(null);
  }, [settings, visible]);

  const handleSave = async () => {
    const parsedAmount = parseAmountInput(payAmount);
    const pay_amount = parsedAmount ?? 0;

    if (!nextPayDate) {
      setError('Choose your next pay date.');
      return;
    }

    setError(null);
    await onSave({
      pay_amount,
      next_pay_date: formatISODate(nextPayDate),
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <View className="w-full max-w-md rounded-card border border-border bg-surface p-3 dark:border-border-dark dark:bg-surface-dark">
          <Text className="mb-1 text-base font-semibold">Pay settings</Text>
          <Text variant="bodySecondary" className="mb-3">
            Fortnightly take-home pay and the date of your next pay.
          </Text>

          <FormField label="Next pay date">
            <DateField
              value={nextPayDate}
              onChange={setNextPayDate}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField label="Take-home pay (AUD)" className="mt-3">
            <Input
              value={payAmount}
              onChangeText={setPayAmount}
              placeholder="2400"
              keyboardType="decimal-pad"
              editable={!isSubmitting}
            />
            <Text variant="caption" className="mt-1">
              Optional for now — you can update this anytime.
            </Text>
          </FormField>

          {error ? (
            <Text variant="caption" className="mt-2" style={{ color: '#DC2626' }}>
              {error}
            </Text>
          ) : null}

          <View className="mt-4 flex-row gap-2">
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
