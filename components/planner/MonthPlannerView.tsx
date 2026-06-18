import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { MonthDayCell } from '@/components/planner/MonthDayCell';
import { Text } from '@/components/ui/Text';
import { MEAL_SLOTS } from '@/lib/mealPlan/constants';
import type { MealPlanEntryWithRecipe } from '@/lib/mealPlan/aggregateIngredients';
import { getMonthWeekRows, MONTH_CALENDAR_WEEKS_VISIBLE } from '@/lib/mealPlan/dates';
import { buildMealPlanLookup } from '@/lib/services/mealPlan';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/cn';

type MonthPlannerViewProps = {
  monthAnchor: Date;
  entries: MealPlanEntryWithRecipe[];
  onSlotPress: (plannedDate: string, mealLabel: (typeof MEAL_SLOTS)[number]) => void;
  onSlotEdit: (plannedDate: string, mealLabel: (typeof MEAL_SLOTS)[number], entry: MealPlanEntryWithRecipe) => void;
};

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function MonthPlannerView({
  monthAnchor,
  entries,
  onSlotPress,
  onSlotEdit,
}: MonthPlannerViewProps) {
  const { isDesktop } = useResponsive();
  const lookup = buildMealPlanLookup(entries);
  const weekRows = useMemo(() => getMonthWeekRows(monthAnchor), [monthAnchor]);
  const calendarWeekRows = useMemo(
    () =>
      Array.from({ length: MONTH_CALENDAR_WEEKS_VISIBLE }, (_, index) => weekRows[index] ?? null),
    [weekRows],
  );

  const calendarBody = (
    <View className={cn('flex-1', isDesktop ? 'min-h-0' : 'min-h-[640px]')}>
      <View className="mb-1 flex-row border-b border-border dark:border-border-dark">
        {WEEKDAY_LABELS.map((label) => (
          <View key={label} className="flex-1 items-center py-1">
            <Text variant="caption" className="font-semibold">
              {label}
            </Text>
          </View>
        ))}
      </View>

      <View className="min-h-0 flex-1 gap-1">
        {calendarWeekRows.map((week, rowIndex) =>
          week ? (
            <View
              key={week[0].toISOString()}
              className="min-h-0 flex-1 flex-row gap-1"
              style={{ flexDirection: 'row' }}>
              {week.map((date) => (
                <MonthDayCell
                  key={date.toISOString()}
                  date={date}
                  monthAnchor={monthAnchor}
                  lookup={lookup}
                  onSlotPress={onSlotPress}
                  onSlotEdit={onSlotEdit}
                />
              ))}
            </View>
          ) : (
            <View
              key={`empty-week-${rowIndex}`}
              className="min-h-0 flex-1 flex-row gap-1"
              style={{ flexDirection: 'row' }}
            />
          ),
        )}
      </View>
    </View>
  );

  if (isDesktop) {
    return <View className="min-h-0 flex-1">{calendarBody}</View>;
  }

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName="flex-grow">
      {calendarBody}
    </ScrollView>
  );
}
