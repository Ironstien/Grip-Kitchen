import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { IngredientThumbnail } from '@/components/ui/IngredientThumbnail';
import { Text } from '@/components/ui/Text';
import {
  MEAL_SLOT_ABBREV,
  MEAL_SLOTS,
  type MealSlot,
} from '@/lib/mealPlan/constants';
import type { MealPlanEntryWithRecipe } from '@/lib/mealPlan/aggregateIngredients';
import { isDateInMonth, toDateKey } from '@/lib/mealPlan/dates';
import { getRecipeHeroImage, getRecipeTitle } from '@/lib/services/mealPlan';
import { cn } from '@/lib/cn';

const SLOT_ROW_HEIGHT = 24;

type MonthDayCellProps = {
  date: Date;
  monthAnchor: Date;
  lookup: Map<string, MealPlanEntryWithRecipe>;
  onSlotPress: (plannedDate: string, mealLabel: MealSlot) => void;
  onSlotEdit: (plannedDate: string, mealLabel: MealSlot, entry: MealPlanEntryWithRecipe) => void;
};

export function MonthDayCell({
  date,
  monthAnchor,
  lookup,
  onSlotPress,
  onSlotEdit,
}: MonthDayCellProps) {
  const dateKey = toDateKey(date);
  const inMonth = isDateInMonth(date, monthAnchor);

  return (
    <View
      className={cn(
        'min-h-0 min-w-0 flex-1 rounded-md border border-border bg-surface p-1 dark:border-border-dark dark:bg-surface-dark',
        !inMonth && 'bg-surface-secondary dark:bg-surface-dark-secondary',
      )}
      style={{ borderWidth: 1 }}>
      <Text
        variant="caption"
        className={cn(
          'mb-1 font-semibold',
          !inMonth && 'text-text-secondary dark:text-text-dark-secondary',
        )}>
        {date.getDate()}
      </Text>

      <View className="gap-0.5">
        {MEAL_SLOTS.map((mealLabel) => {
          const entry = lookup.get(`${dateKey}:${mealLabel}`);
          return (
            <MonthMealSlotRow
              key={mealLabel}
              mealLabel={mealLabel}
              entry={entry}
              muted={!inMonth}
              onPress={() => onSlotPress(dateKey, mealLabel)}
              onEdit={entry ? () => onSlotEdit(dateKey, mealLabel, entry) : undefined}
            />
          );
        })}
      </View>
    </View>
  );
}

function MonthMealSlotRow({
  mealLabel,
  entry,
  muted,
  onPress,
  onEdit,
}: {
  mealLabel: MealSlot;
  entry?: MealPlanEntryWithRecipe;
  muted?: boolean;
  onPress: () => void;
  onEdit?: () => void;
}) {
  const title = getRecipeTitle(entry);
  const filled = Boolean(title);
  const heroImage = getRecipeHeroImage(entry);

  if (filled) {
    return (
      <View
        className={cn(
          'flex-row items-center gap-1 rounded border border-brand/30 bg-surface-secondary px-0.5 dark:border-brand-dark/30 dark:bg-surface-dark-secondary',
          muted && 'opacity-70',
        )}
        style={{ height: SLOT_ROW_HEIGHT }}>
        <Text variant="caption" className="w-3 text-[10px] font-bold">
          {MEAL_SLOT_ABBREV[mealLabel]}
        </Text>
        <IngredientThumbnail uri={heroImage} size={18} className="rounded" />
        <Text className="min-w-0 flex-1 text-[10px] leading-tight" numberOfLines={1}>
          {title}
        </Text>
        <Button
          label="Edit"
          variant="ghost"
          onPress={onEdit ?? onPress}
          className="min-h-[20px] shrink-0 px-1 py-0"
          textClassName="text-[10px]"
        />
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Add ${mealLabel}`}
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-1 rounded border border-dashed border-border bg-field px-1 active:opacity-80 dark:border-border-dark dark:bg-field-dark',
        muted && 'opacity-70',
      )}
      style={{ height: SLOT_ROW_HEIGHT, zIndex: 1 }}>
      <Text variant="caption" className="w-3 text-[10px] font-bold">
        {MEAL_SLOT_ABBREV[mealLabel]}
      </Text>
      <Ionicons name="add" size={12} color="#2098FF" />
      <Text className="text-[10px] text-brand dark:text-brand-dark">Add</Text>
    </Pressable>
  );
}
