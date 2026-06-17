import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, View } from 'react-native';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Heading, Text } from '@/components/ui/Text';
import { pagePaddingClass } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useMealPlanReview } from '@/hooks/useMealPlanReview';
import { useShoppingListMutations } from '@/hooks/useShoppingList';
import { defaultShoppingListName, formatWeekRangeLabel, parseDateKey } from '@/lib/mealPlan/dates';
import { formatQuantity } from '@/lib/units';
import { cn } from '@/lib/cn';

export default function MealPlanReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const params = useLocalSearchParams<{ weekStart?: string }>();
  const weekStart = useMemo(
    () => parseDateKey(typeof params.weekStart === 'string' ? params.weekStart : defaultShoppingListName()),
    [params.weekStart],
  );

  const { lines, toBuyLines, plannedMealCount, isLoading, weekStartKey } = useMealPlanReview(weekStart);
  const [listName, setListName] = useState(defaultShoppingListName());
  const { createFromMealPlan } = useShoppingListMutations();

  const handleCreateList = async () => {
    if (toBuyLines.length === 0) {
      Alert.alert('Nothing to buy', 'Your pantry already covers everything planned this week.');
      return;
    }

    try {
      const result = await createFromMealPlan.mutateAsync({
        lines: toBuyLines.map((line) => ({
          ingredientId: line.ingredientId,
          toBuyQuantity: line.toBuyQuantity,
        })),
        name: listName.trim() || defaultShoppingListName(),
        weekStart: weekStartKey,
      });

      Alert.alert(
        'Shopping list created',
        `${result.itemCount} item${result.itemCount === 1 ? '' : 's'} added to "${result.list.name}".`,
        [
          {
            text: 'Go to Shop',
            onPress: () => router.replace('/(main)/(tabs)/shop' as Href),
          },
          { text: 'Stay here', style: 'cancel' },
        ],
      );
    } catch (error) {
      Alert.alert('Could not create list', error instanceof Error ? error.message : 'Try again.');
    }
  };

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark" style={{ paddingTop: insets.top }}>
      <View className={`border-b border-border ${pagePaddingClass(false)} pb-3 dark:border-border-dark`}>
        <View className="mb-3 flex-row items-center gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            className="h-9 w-9 items-center justify-center rounded-button border border-border dark:border-border-dark">
            <Ionicons name="chevron-back" size={20} color={palette.textSecondary} />
          </Pressable>
          <View className="min-w-0 flex-1">
            <Heading level={2}>Review ingredients</Heading>
            <Text variant="caption">{formatWeekRangeLabel(weekStart)} · {plannedMealCount} meals</Text>
          </View>
        </View>

        <Text variant="label" className="mb-1">
          Shopping list name
        </Text>
        <Input value={listName} onChangeText={setListName} placeholder={defaultShoppingListName()} />
      </View>

      {isLoading ? (
        <ActivityIndicator className="mt-8" />
      ) : lines.length === 0 ? (
        <View className={`flex-1 ${pagePaddingClass(false)}`}>
          <Text variant="bodySecondary" className="mt-8 text-center">
            No ingredients to review. Add recipes to your plan first.
          </Text>
        </View>
      ) : (
        <FlatList
          data={lines}
          keyExtractor={(item) => item.ingredientId}
          contentContainerClassName={`${pagePaddingClass(false)} pb-28`}
          ListHeaderComponent={
            <View className="mb-3 gap-1">
              <Text variant="label">Required · Pantry · To buy</Text>
              <Text variant="caption">
                {toBuyLines.length} item{toBuyLines.length === 1 ? '' : 's'} need purchasing
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const covered = item.toBuyQuantity <= 0;
            return (
              <View className="mb-2 rounded-card border border-border px-3 py-2.5 dark:border-border-dark">
                <View className="mb-1 flex-row items-start justify-between gap-2">
                  <Text className="flex-1 font-semibold">{item.displayName}</Text>
                  <Badge
                    label={covered ? 'Covered' : 'Buy'}
                    status={covered ? 'success' : 'warning'}
                  />
                </View>
                <View className="flex-row flex-wrap gap-x-4 gap-y-1">
                  <Text variant="caption">
                    Need {formatQuantity(item.requiredQuantity, item.stockUnit)}
                  </Text>
                  <Text variant="caption">
                    Pantry {formatQuantity(item.pantryQuantity, item.stockUnit)}
                  </Text>
                  <Text
                    variant="caption"
                    className={cn(!covered && 'font-semibold text-status-warning dark:text-status-warning')}>
                    Buy {formatQuantity(item.toBuyQuantity, item.stockUnit)}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <View
        className={`absolute bottom-0 left-0 right-0 border-t border-border bg-surface ${pagePaddingClass(false)} pb-4 pt-3 dark:border-border-dark dark:bg-surface-dark`}
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <Button
          label={createFromMealPlan.isPending ? 'Creating…' : 'Create shopping list'}
          onPress={() => void handleCreateList()}
          disabled={createFromMealPlan.isPending || toBuyLines.length === 0}
        />
      </View>
    </View>
  );
}
