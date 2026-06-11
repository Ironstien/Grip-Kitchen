import { View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/Text';
import { useRecipeCostBreakdown } from '@/hooks/useRecipeCostBreakdown';
import { formatAud } from '@/lib/cost';
import { getIngredientDisplayName } from '@/lib/ingredients';
import { formatQuantity } from '@/lib/units';
import type { RecipeWithIngredients } from '@/lib/services/recipes';

type RecipeIngredientListProps = {
  recipe: RecipeWithIngredients;
  targetServings: number;
  showCostSummary?: boolean;
};

export function RecipeIngredientList({
  recipe,
  targetServings,
  showCostSummary = true,
}: RecipeIngredientListProps) {
  const { costs, scaledIngredients, stockStatusByIngredient } = useRecipeCostBreakdown(
    recipe,
    targetServings,
  );

  return (
    <View className="gap-3">
      {scaledIngredients.map((entry) => {
        const catalog = entry.ingredient;
        const recipeUnit = entry.required_unit || catalog?.stock_unit || 'each';
        const inStock = stockStatusByIngredient.get(entry.ingredient_id) ?? false;
        const costLine = costs.lines.find((line) => line.ingredientId === entry.ingredient_id);

        return (
          <View
            key={entry.id}
            className="flex-row items-center justify-between gap-3 rounded-card border border-border px-4 py-3 dark:border-border-dark">
            <View className="flex-1">
              <Text className="font-medium">
                {catalog ? getIngredientDisplayName(catalog) : 'Missing ingredient link'}
              </Text>
              <Text variant="bodySecondary">
                {formatQuantity(entry.scaled_quantity, recipeUnit)}
              </Text>
              {!costLine?.converted ? (
                <Text variant="caption" className="text-status-danger">
                  No conversion rule for cost
                </Text>
              ) : null}
            </View>
            <View className="items-end gap-1">
              <Badge label={inStock ? 'In stock' : 'Missing'} status={inStock ? 'success' : 'danger'} />
              <Text variant="caption">{formatAud(costLine?.cost ?? 0)}</Text>
            </View>
          </View>
        );
      })}

      {showCostSummary ? (
        <View className="mt-2 rounded-card border border-border bg-surface-secondary p-4 dark:border-border-dark dark:bg-surface-dark-secondary">
          <Text variant="label">Cost breakdown</Text>
          <Text className="mt-2 font-semibold">Total: {formatAud(costs.totalCost)}</Text>
          <Text variant="bodySecondary">
            Per serving ({targetServings}): {formatAud(costs.perServingCost)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
