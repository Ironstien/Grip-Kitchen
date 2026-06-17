import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import type { MealSlot } from '@/lib/mealPlan/constants';
import type { MealPlanEntryWithRecipe } from '@/lib/mealPlan/aggregateIngredients';
import { getRecipeTitle } from '@/lib/services/mealPlan';
import { cn } from '@/lib/cn';

type MealSlotCardProps = {
  mealLabel: MealSlot;
  entry?: MealPlanEntryWithRecipe;
  compact?: boolean;
  onPress: () => void;
};

export function MealSlotCard({ mealLabel, entry, compact = false, onPress }: MealSlotCardProps) {
  const title = getRecipeTitle(entry);
  const filled = Boolean(title);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={cn(
        'rounded-card border border-border bg-surface-secondary dark:border-border-dark dark:bg-surface-dark-secondary',
        compact ? 'min-h-[52px] p-2' : 'min-h-[64px] p-2.5',
        filled ? 'border-brand/40' : 'border-dashed',
      )}>
      <Text variant="caption" className="mb-0.5 font-medium uppercase tracking-wide">
        {mealLabel}
      </Text>
      {filled ? (
        <View className="gap-0.5">
          <Text className={cn('font-semibold', compact ? 'text-xs' : 'text-sm')} numberOfLines={2}>
            {title}
          </Text>
          <Text variant="caption">{entry?.target_servings} servings</Text>
        </View>
      ) : (
        <View className="flex-row items-center gap-1 pt-0.5">
          <Ionicons name="add-circle-outline" size={14} color="#2098FF" />
          <Text variant="caption" className="text-brand dark:text-brand-dark">
            Add recipe
          </Text>
        </View>
      )}
    </Pressable>
  );
}
