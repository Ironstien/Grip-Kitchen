import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { MealSlotCard } from '@/components/planner/MealSlotCard';
import { Text } from '@/components/ui/Text';
import { MEAL_SLOTS } from '@/lib/mealPlan/constants';
import type { MealPlanEntryWithRecipe } from '@/lib/mealPlan/aggregateIngredients';
import {
  formatDayShort,
  formatMonthYear,
  getMonthGridDates,
  toDateKey,
} from '@/lib/mealPlan/dates';
import { buildMealPlanLookup } from '@/lib/services/mealPlan';
import { cn } from '@/lib/cn';

type MonthPlannerViewProps = {
  monthAnchor: Date;
  entries: MealPlanEntryWithRecipe[];
  onSlotPress: (plannedDate: string, mealLabel: (typeof MEAL_SLOTS)[number]) => void;
};

export function MonthPlannerView({ monthAnchor, entries, onSlotPress }: MonthPlannerViewProps) {
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));
  const lookup = buildMealPlanLookup(entries);
  const gridDates = getMonthGridDates(monthAnchor);

  const mealsByDate = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries) {
      counts.set(entry.planned_date, (counts.get(entry.planned_date) ?? 0) + 1);
    }
    return counts;
  }, [entries]);

  const currentMonth = monthAnchor.getMonth();

  return (
    <View className="flex-1">
      <Text variant="label" className="mb-2">
        {formatMonthYear(monthAnchor)}
      </Text>

      <View className="mb-1 flex-row">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => (
          <View key={`${label}-${index}`} className="flex-1 items-center py-1">
            <Text variant="caption">{label}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {gridDates.map((date) => {
          const dateKey = toDateKey(date);
          const inMonth = date.getMonth() === currentMonth;
          const selected = dateKey === selectedDateKey;
          const mealCount = mealsByDate.get(dateKey) ?? 0;

          return (
            <Pressable
              key={dateKey}
              accessibilityRole="button"
              onPress={() => setSelectedDateKey(dateKey)}
              className={cn(
                'aspect-square w-[14.28%] items-center justify-center rounded-button',
                selected && 'bg-brand/15 dark:bg-brand-dark/20',
                !inMonth && 'opacity-40',
              )}>
              <Text className={cn('text-sm', selected && 'font-semibold text-brand dark:text-brand-dark')}>
                {date.getDate()}
              </Text>
              {mealCount > 0 ? (
                <View className="mt-0.5 h-1.5 w-1.5 rounded-full bg-brand dark:bg-brand-dark" />
              ) : (
                <View className="mt-0.5 h-1.5 w-1.5" />
              )}
            </Pressable>
          );
        })}
      </View>

      <View className="mt-4 border-t border-border pt-3 dark:border-border-dark">
        <Text variant="label" className="mb-2">
          {formatDayShort(new Date(selectedDateKey + 'T12:00:00'))}
        </Text>
        <View className="gap-2">
          {MEAL_SLOTS.map((mealLabel) => (
            <MealSlotCard
              key={`${selectedDateKey}:${mealLabel}`}
              mealLabel={mealLabel}
              entry={lookup.get(`${selectedDateKey}:${mealLabel}`)}
              compact
              onPress={() => onSlotPress(selectedDateKey, mealLabel)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
