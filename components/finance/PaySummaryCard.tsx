import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { formatAUD, formatDisplayDate } from '@/lib/finance/format';
import { parseISODate, type PayPeriodSummary } from '@/lib/finance/payPeriod';
import type { FinanceSettings } from '@/types/database';

type PaySummaryCardProps = {
  settings: FinanceSettings | null;
  payPeriod: PayPeriodSummary;
  onPress: () => void;
};

export function PaySummaryCard({ settings, payPeriod, onPress }: PaySummaryCardProps) {
  const hasPaySettings = Boolean(settings?.next_pay_date);
  const nextPayDate = settings?.next_pay_date ? parseISODate(settings.next_pay_date) : null;
  const isOvercommitted = payPeriod.remainingTotal < 0;

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card className="gap-3">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text variant="label">Next pay (take-home)</Text>
            {hasPaySettings ? (
              <>
                <Text className="mt-1 text-2xl font-bold text-text dark:text-text-dark">
                  {formatAUD(settings?.pay_amount ?? 0)}
                </Text>
                {nextPayDate ? (
                  <Text variant="bodySecondary" className="mt-0.5">
                    {formatDisplayDate(nextPayDate)}
                    {payPeriod.daysUntilPay != null
                      ? ` · in ${payPeriod.daysUntilPay} day${payPeriod.daysUntilPay === 1 ? '' : 's'}`
                      : ''}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text variant="bodySecondary" className="mt-1">
                Tap to set your fortnightly pay and next pay date.
              </Text>
            )}
          </View>
          <Ionicons name="create-outline" size={18} color="#888888" />
        </View>

        {hasPaySettings ? (
          <View className="gap-2 border-t border-border pt-3 dark:border-border-dark">
            <View className="flex-row items-center justify-between">
              <Text variant="bodySecondary">Due before next pay</Text>
              <Text className="font-semibold">{formatAUD(payPeriod.committedTotal)}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text variant="bodySecondary">Left after bills</Text>
              <Text
                className="font-semibold"
                style={{ color: isOvercommitted ? '#DC2626' : undefined }}>
                {formatAUD(payPeriod.remainingTotal)}
              </Text>
            </View>
            {isOvercommitted ? (
              <Text variant="caption" style={{ color: '#DC2626' }}>
                Bills exceed this pay — review expenses or adjust pay amount.
              </Text>
            ) : null}
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}
