import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { MEAL_SLOTS } from '@/lib/mealPlan/constants';
import type { MealPlanEntryWithRecipe } from '@/lib/mealPlan/aggregateIngredients';
import { formatDayShort, getWeekDates, toDateKey } from '@/lib/mealPlan/dates';
import { getRecipeTitle } from '@/lib/services/mealPlan';
import { cn } from '@/lib/cn';

type AgendaPlannerViewProps = {
  weekStart: Date;
  entries: MealPlanEntryWithRecipe[];
  onEntryPress: (entry: MealPlanEntryWithRecipe) => void;
};

const SLOT_ORDER = new Map(MEAL_SLOTS.map((slot, index) => [slot, index]));

export function AgendaPlannerView({ weekStart, entries, onEntryPress }: AgendaPlannerViewProps) {
  const weekDates = getWeekDates(weekStart);

  const grouped = weekDates.map((date) => {
    const dateKey = toDateKey(date);
    const dayEntries = entries
      .filter((entry) => entry.planned_date === dateKey)
      .sort(
        (a, b) =>
          (SLOT_ORDER.get(a.meal_label as (typeof MEAL_SLOTS)[number]) ?? 99) -
          (SLOT_ORDER.get(b.meal_label as (typeof MEAL_SLOTS)[number]) ?? 99),
      );
    return { date, dateKey, dayEntries };
  });

  const hasAny = entries.length > 0;

  if (!hasAny) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <Text variant="bodySecondary" className="text-center">
          No meals planned this week. Switch to Week view to add recipes.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {grouped.map(({ date, dateKey, dayEntries }) => {
        if (dayEntries.length === 0) {
          return null;
        }

        return (
          <View key={dateKey} className="mb-4">
            <Text variant="label" className="mb-2">
              {formatDayShort(date)}
            </Text>
            <View className="gap-2">
              {dayEntries.map((entry) => (
                <AgendaRow key={entry.id} entry={entry} onPress={() => onEntryPress(entry)} />
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

function AgendaRow({
  entry,
  onPress,
}: {
  entry: MealPlanEntryWithRecipe;
  onPress: () => void;
}) {
  const title = getRecipeTitle(entry) ?? 'Unknown recipe';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={cn(
        'flex-row items-center justify-between rounded-card border border-border bg-surface-secondary px-3 py-2.5 dark:border-border-dark dark:bg-surface-dark-secondary',
      )}>
      <View className="min-w-0 flex-1 pr-3">
        <Text variant="caption" className="font-medium uppercase">
          {entry.meal_label}
        </Text>
        <Text className="font-semibold" numberOfLines={2}>
          {title}
        </Text>
        <Text variant="caption">{entry.target_servings} servings</Text>
      </View>
      <Text className="text-brand dark:text-brand-dark">Edit</Text>
    </Pressable>
  );
}
