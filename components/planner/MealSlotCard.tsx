import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { IngredientThumbnail } from '@/components/ui/IngredientThumbnail';
import { Text } from '@/components/ui/Text';
import type { MealSlot } from '@/lib/mealPlan/constants';
import type { MealPlanEntryWithRecipe } from '@/lib/mealPlan/aggregateIngredients';
import { getRecipeHeroImage, getRecipeTitle } from '@/lib/services/mealPlan';
import { cn } from '@/lib/cn';

type MealSlotCardProps = {
  mealLabel: MealSlot | string;
  entry?: MealPlanEntryWithRecipe;
  compact?: boolean;
  onPress: () => void;
  onEdit?: () => void;
};

export function MealSlotCard({
  mealLabel,
  entry,
  compact = false,
  onPress,
  onEdit,
}: MealSlotCardProps) {
  const title = getRecipeTitle(entry);
  const filled = Boolean(title);
  const heroImage = getRecipeHeroImage(entry);
  const imageSize = compact ? 40 : 52;
  const handleEdit = onEdit ?? onPress;

  if (filled) {
    return (
      <View
        className={cn(
          'rounded-card border border-brand/40 bg-surface-secondary dark:border-brand-dark/40 dark:bg-surface-dark-secondary',
          compact ? 'p-2' : 'p-2.5',
        )}>
        <Text variant="caption" className="mb-1.5 font-medium uppercase tracking-wide">
          {mealLabel}
        </Text>
        <View className="flex-row items-center gap-2.5">
          <IngredientThumbnail uri={heroImage} size={imageSize} />
          <View className="min-w-0 flex-1 gap-0.5">
            <Text className={cn('font-semibold', compact ? 'text-xs' : 'text-sm')} numberOfLines={2}>
              {title}
            </Text>
            <Text variant="caption">{entry?.target_servings} servings</Text>
          </View>
          <Button label="Edit" variant="ghost" onPress={handleEdit} className="shrink-0" />
        </View>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={cn(
        'rounded-card border border-dashed border-border bg-surface-secondary dark:border-border-dark dark:bg-surface-dark-secondary',
        compact ? 'min-h-[52px] p-2' : 'min-h-[64px] p-2.5',
      )}>
      <Text variant="caption" className="mb-0.5 font-medium uppercase tracking-wide">
        {mealLabel}
      </Text>
      <View className="flex-row items-center gap-1 pt-0.5">
        <Ionicons name="add-circle-outline" size={14} color="#2098FF" />
        <Text variant="caption" className="text-brand dark:text-brand-dark">
          Add recipe
        </Text>
      </View>
    </Pressable>
  );
}
