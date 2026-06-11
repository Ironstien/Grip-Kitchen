import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { formatAud } from '@/lib/cost';
import { fieldPanelClassName } from '@/lib/fieldStyles';
import type { RecipeWithIngredients } from '@/lib/services/recipes';

type RecipeDetailToolbarProps = {
  recipe: RecipeWithIngredients;
  targetServings: number;
  totalCost: number;
  perServingCost: number;
  onEdit: () => void;
  onDecreaseServings: () => void;
  onIncreaseServings: () => void;
};

export function RecipeDetailToolbar({
  recipe,
  targetServings,
  totalCost,
  perServingCost,
  onEdit,
  onDecreaseServings,
  onIncreaseServings,
}: RecipeDetailToolbarProps) {
  return (
    <View className="flex-row flex-wrap items-stretch gap-2">
      <Button label="Edit" variant="secondary" onPress={onEdit} className="self-center" />

      <View className={`min-w-[140px] justify-center ${fieldPanelClassName}`}>
        {recipe.time_to_cook != null ? (
          <Text variant="bodySecondary">{recipe.time_to_cook} min</Text>
        ) : null}
        <Text variant="bodySecondary">Base recipe: {recipe.base_serving_size} servings</Text>
      </View>

      <View className={`min-w-[160px] flex-1 justify-center ${fieldPanelClassName}`}>
        <Text variant="label">Cost breakdown</Text>
        <Text className="mt-1 font-semibold">Total: {formatAud(totalCost)}</Text>
        <Text variant="bodySecondary">
          Per serving ({targetServings}): {formatAud(perServingCost)}
        </Text>
      </View>

      <View
        className={`ml-auto flex-row items-center gap-2 self-center px-3 py-2 ${fieldPanelClassName}`}>
        <Button label="-" variant="ghost" onPress={onDecreaseServings} />
        <Text className="min-w-[72px] text-center font-medium">{targetServings} servings</Text>
        <Button label="+" variant="ghost" onPress={onIncreaseServings} />
      </View>
    </View>
  );
}
