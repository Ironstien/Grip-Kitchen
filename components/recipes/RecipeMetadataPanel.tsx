import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { fieldPanelClassName } from '@/lib/fieldStyles';
import type { RecipeWithIngredients } from '@/lib/services/recipes';

type RecipeMetadataPanelProps = {
  recipe: Pick<RecipeWithIngredients, 'time_to_cook' | 'base_serving_size' | 'dietary_tags'>;
};

export function RecipeMetadataPanel({ recipe }: RecipeMetadataPanelProps) {
  const hasTime = recipe.time_to_cook != null;
  const hasTags = recipe.dietary_tags.length > 0;

  if (!hasTime && !hasTags) {
    return (
      <View className={fieldPanelClassName}>
        <Text variant="bodySecondary">Base recipe: {recipe.base_serving_size} servings</Text>
      </View>
    );
  }

  return (
    <View className={`gap-2 ${fieldPanelClassName}`}>
      <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
        {hasTime ? <Text variant="bodySecondary">{recipe.time_to_cook} min</Text> : null}
        <Text variant="bodySecondary">Base recipe: {recipe.base_serving_size} servings</Text>
      </View>
      {hasTags ? (
        <Text variant="bodySecondary">{recipe.dietary_tags.join(' · ')}</Text>
      ) : null}
    </View>
  );
}
