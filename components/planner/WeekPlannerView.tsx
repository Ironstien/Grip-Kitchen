import { ScrollView, View } from 'react-native';

import { MealSlotCard } from '@/components/planner/MealSlotCard';
import { Text } from '@/components/ui/Text';
import { MEAL_SLOTS } from '@/lib/mealPlan/constants';
import type { MealPlanEntryWithRecipe } from '@/lib/mealPlan/aggregateIngredients';
import { formatDayLabel, getWeekDates, toDateKey } from '@/lib/mealPlan/dates';
import { buildMealPlanLookup } from '@/lib/services/mealPlan';

type WeekPlannerViewProps = {
  weekStart: Date;
  entries: MealPlanEntryWithRecipe[];
  onSlotPress: (plannedDate: string, mealLabel: (typeof MEAL_SLOTS)[number]) => void;
};

export function WeekPlannerView({ weekStart, entries, onSlotPress }: WeekPlannerViewProps) {
  const lookup = buildMealPlanLookup(entries);
  const weekDates = getWeekDates(weekStart);

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {weekDates.map((date) => {
        const dateKey = toDateKey(date);
        return (
          <View key={dateKey} className="mb-4">
            <Text variant="label" className="mb-2">
              {formatDayLabel(date)} {date.getDate()}
            </Text>
            <View className="gap-2">
              {MEAL_SLOTS.map((mealLabel) => (
                <MealSlotCard
                  key={`${dateKey}:${mealLabel}`}
                  mealLabel={mealLabel}
                  entry={lookup.get(`${dateKey}:${mealLabel}`)}
                  onPress={() => onSlotPress(dateKey, mealLabel)}
                />
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
