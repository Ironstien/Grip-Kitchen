import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { MonthDayCell } from '@/components/planner/MonthDayCell';
import { Text } from '@/components/ui/Text';
import { MEAL_SLOTS } from '@/lib/mealPlan/constants';
import type { MealPlanEntryWithRecipe } from '@/lib/mealPlan/aggregateIngredients';
import {
  getInitialMonthWeekPage,
  getMonthWeekRows,
  getVisibleMonthWeekPageCount,
  MONTH_CALENDAR_WEEKS_VISIBLE,
} from '@/lib/mealPlan/dates';
import { buildMealPlanLookup } from '@/lib/services/mealPlan';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/contexts/ThemeContext';
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
  const { palette } = useTheme();
  const lookup = buildMealPlanLookup(entries);
  const weekRows = useMemo(() => getMonthWeekRows(monthAnchor), [monthAnchor]);
  const pageCount = getVisibleMonthWeekPageCount(weekRows.length);
  const [weekPage, setWeekPage] = useState(() => getInitialMonthWeekPage(monthAnchor, weekRows.length));

  useEffect(() => {
    setWeekPage(getInitialMonthWeekPage(monthAnchor, weekRows.length));
  }, [monthAnchor, weekRows.length]);

  const visibleWeeks = weekRows.slice(
    weekPage * MONTH_CALENDAR_WEEKS_VISIBLE,
    weekPage * MONTH_CALENDAR_WEEKS_VISIBLE + MONTH_CALENDAR_WEEKS_VISIBLE,
  );
  const calendarWeekRows = Array.from({ length: MONTH_CALENDAR_WEEKS_VISIBLE }, (_, index) =>
    visibleWeeks[index] ?? null,
  );

  const calendarBody = (
    <View className={cn('flex-1', isDesktop ? 'min-h-0' : 'min-h-[640px]')}>
      <View className="mb-1 flex-row border-b border-border dark:border-border-dark">
        {WEEKDAY_LABELS.map((label) => (
          <View key={label} className="flex-1 items-center py-1.5">
            <Text variant="caption" className="font-semibold">
              {label}
            </Text>
          </View>
        ))}
      </View>

      {pageCount > 1 ? (
        <View className="mb-1 flex-row items-center justify-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous weeks"
            disabled={weekPage === 0}
            onPress={() => setWeekPage((current) => Math.max(0, current - 1))}
            className={cn('h-7 w-7 items-center justify-center rounded-button', weekPage === 0 && 'opacity-30')}>
            <Ionicons name="chevron-back" size={16} color={palette.textSecondary} />
          </Pressable>
          <Text variant="caption">
            Weeks {weekPage * MONTH_CALENDAR_WEEKS_VISIBLE + 1}–
            {Math.min((weekPage + 1) * MONTH_CALENDAR_WEEKS_VISIBLE, weekRows.length)} of {weekRows.length}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next weeks"
            disabled={weekPage >= pageCount - 1}
            onPress={() => setWeekPage((current) => Math.min(pageCount - 1, current + 1))}
            className={cn(
              'h-7 w-7 items-center justify-center rounded-button',
              weekPage >= pageCount - 1 && 'opacity-30',
            )}>
            <Ionicons name="chevron-forward" size={16} color={palette.textSecondary} />
          </Pressable>
        </View>
      ) : null}

      <View className="min-h-0 flex-1 gap-px bg-border dark:bg-border-dark">
        {calendarWeekRows.map((week, rowIndex) =>
          week ? (
            <View key={week[0].toISOString()} className="min-h-0 flex-1 flex-row">
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
            <View key={`empty-week-${rowIndex}`} className="min-h-0 flex-1 flex-row bg-surface dark:bg-surface-dark" />
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
