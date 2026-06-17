import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AgendaPlannerView } from '@/components/planner/AgendaPlannerView';
import { MealSlotSheet } from '@/components/planner/MealSlotSheet';
import { MonthPlannerView } from '@/components/planner/MonthPlannerView';
import { PlannerViewTabs, type PlannerViewMode } from '@/components/planner/PlannerViewTabs';
import { WeekPlannerView } from '@/components/planner/WeekPlannerView';
import { Button } from '@/components/ui/Button';
import { Heading, Text } from '@/components/ui/Text';
import { pageHeaderMarginClass, pagePaddingClass } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useMealPlanRange } from '@/hooks/useMealPlan';
import { useResponsive } from '@/hooks/useResponsive';
import type { MealPlanEntryWithRecipe } from '@/lib/mealPlan/aggregateIngredients';
import type { MealSlot } from '@/lib/mealPlan/constants';
import {
  addDays,
  addWeeks,
  formatMonthYear,
  formatWeekRangeLabel,
  getMonthGridDates,
  startOfWeekMonday,
  toDateKey,
} from '@/lib/mealPlan/dates';

type SlotSelection = {
  plannedDate: string;
  mealLabel: MealSlot;
  entry?: MealPlanEntryWithRecipe;
};

export default function PlannerScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const { isDesktop } = useResponsive();
  const paddingClass = pagePaddingClass(isDesktop);

  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [monthAnchor, setMonthAnchor] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [viewMode, setViewMode] = useState<PlannerViewMode>('week');
  const [slotSelection, setSlotSelection] = useState<SlotSelection | null>(null);

  const weekStartKey = toDateKey(weekStart);
  const weekEndKey = toDateKey(addDays(weekStart, 6));
  const monthGridDates = useMemo(() => getMonthGridDates(monthAnchor), [monthAnchor]);
  const queryStartKey = viewMode === 'month' ? toDateKey(monthGridDates[0]) : weekStartKey;
  const queryEndKey =
    viewMode === 'month' ? toDateKey(monthGridDates[monthGridDates.length - 1]) : weekEndKey;
  const { data: entries = [], isLoading } = useMealPlanRange(queryStartKey, queryEndKey);

  const openSlot = (plannedDate: string, mealLabel: MealSlot, entry?: MealPlanEntryWithRecipe) => {
    setSlotSelection({ plannedDate, mealLabel, entry });
  };

  const handleReview = () => {
    router.push(`/(main)/planner/review?weekStart=${weekStartKey}` as Href);
  };

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark">
      <View className={`border-b border-border dark:border-border-dark ${paddingClass} pb-3`}>
        <View className={pageHeaderMarginClass(isDesktop)}>
          <Heading level={2}>Planner</Heading>
          <Text variant="caption" className="mt-0.5">
            Plan meals for the week, then generate a shopping list.
          </Text>
        </View>

        <View className="mb-3 flex-row items-center justify-between gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={viewMode === 'month' ? 'Previous month' : 'Previous week'}
            onPress={() => {
              if (viewMode === 'month') {
                setMonthAnchor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
              } else {
                setWeekStart((current) => addWeeks(current, -1));
              }
            }}
            className="h-9 w-9 items-center justify-center rounded-button border border-border dark:border-border-dark">
            <Ionicons name="chevron-back" size={20} color={palette.textSecondary} />
          </Pressable>

          <Text className="flex-1 text-center text-sm font-semibold">
            {viewMode === 'month' ? formatMonthYear(monthAnchor) : formatWeekRangeLabel(weekStart)}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={viewMode === 'month' ? 'Next month' : 'Next week'}
            onPress={() => {
              if (viewMode === 'month') {
                setMonthAnchor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
              } else {
                setWeekStart((current) => addWeeks(current, 1));
              }
            }}
            className="h-9 w-9 items-center justify-center rounded-button border border-border dark:border-border-dark">
            <Ionicons name="chevron-forward" size={20} color={palette.textSecondary} />
          </Pressable>
        </View>

        <PlannerViewTabs value={viewMode} onChange={setViewMode} />
      </View>

      <View className={`flex-1 ${paddingClass} pt-3`}>
        {isLoading ? (
          <ActivityIndicator className="mt-8" />
        ) : viewMode === 'week' ? (
          <WeekPlannerView
            weekStart={weekStart}
            entries={entries}
            onSlotPress={(plannedDate, mealLabel) => openSlot(plannedDate, mealLabel)}
            onSlotEdit={(plannedDate, mealLabel, entry) =>
              openSlot(plannedDate, mealLabel, entry)
            }
          />
        ) : viewMode === 'month' ? (
          <MonthPlannerView
            monthAnchor={monthAnchor}
            entries={entries}
            onSlotPress={(plannedDate, mealLabel) => openSlot(plannedDate, mealLabel)}
            onSlotEdit={(plannedDate, mealLabel, entry) =>
              openSlot(plannedDate, mealLabel, entry)
            }
          />
        ) : (
          <AgendaPlannerView
            weekStart={weekStart}
            entries={entries}
            onEntryPress={(entry) =>
              openSlot(entry.planned_date, entry.meal_label as MealSlot, entry)
            }
          />
        )}
      </View>

      <View className={`border-t border-border ${paddingClass} pb-4 pt-3 dark:border-border-dark`}>
        <Button label="Review ingredients" onPress={handleReview} />
      </View>

      {slotSelection ? (
        <MealSlotSheet
          visible
          onClose={() => setSlotSelection(null)}
          plannedDate={slotSelection.plannedDate}
          mealLabel={slotSelection.mealLabel}
          entry={slotSelection.entry}
          weekStartKey={weekStartKey}
          weekEndKey={weekEndKey}
        />
      ) : null}
    </View>
  );
}
