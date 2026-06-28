import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/contexts/ThemeContext';
import { formatAUD, formatShortDate } from '@/lib/finance/format';
import { describeDueRule, FREQUENCY_LABELS } from '@/lib/finance/payPeriod';
import type { RecurringExpense } from '@/types/database';

type ExpenseRowProps = {
  expense: RecurringExpense;
  dueDate?: Date;
  onPress?: () => void;
  onDelete?: () => void;
  showDueDate?: boolean;
  muted?: boolean;
};

export function ExpenseRow({
  expense,
  dueDate,
  onPress,
  onDelete,
  showDueDate = false,
  muted = false,
}: ExpenseRowProps) {
  const { palette } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center rounded-card border border-border px-3 py-2.5 dark:border-border-dark"
      style={{
        backgroundColor: palette.backgroundSecondary,
        opacity: muted ? 0.65 : 1,
      }}>
      <View className="min-w-0 flex-1">
        <Text className="text-sm font-medium text-text dark:text-text-dark">{expense.name}</Text>
        <Text variant="caption" className="mt-0.5">
          {showDueDate && dueDate
            ? `${formatShortDate(dueDate)} · ${FREQUENCY_LABELS[expense.frequency]}`
            : `${FREQUENCY_LABELS[expense.frequency]} · ${describeDueRule(expense)}`}
          {expense.category ? ` · ${expense.category}` : ''}
          {!expense.is_active ? ' · Paused' : ''}
        </Text>
      </View>
      <Text className="ml-3 text-sm font-semibold">{formatAUD(expense.amount)}</Text>
      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${expense.name}`}
          onPress={(event) => {
            event.stopPropagation?.();
            onDelete();
          }}
          className="ml-2 p-1">
          <Ionicons name="trash-outline" size={16} color={palette.textMuted} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}
