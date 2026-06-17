import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Href, Redirect, useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Heading, Text } from '@/components/ui/Text';
import { pageHeaderMarginClass, pagePaddingClass } from '@/constants/theme';
import { useIngredients } from '@/hooks/useIngredients';
import { useResponsive } from '@/hooks/useResponsive';
import { formatPurchaseSummary, getIngredientDisplayName } from '@/lib/ingredients';
import { IngredientPantryToggle } from '@/components/ingredients/IngredientPantryToggle';
import { MasterListRow } from '@/components/layout/MasterListPane';

export default function IngredientsScreen() {
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const [search, setSearch] = useState('');

  const { data: ingredients = [], isLoading } = useIngredients();

  const filteredIngredients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return ingredients;
    }

    return ingredients.filter(
      (ingredient) =>
        ingredient.name.toLowerCase().includes(query) ||
        ingredient.display_name.toLowerCase().includes(query) ||
        ingredient.category.toLowerCase().includes(query),
    );
  }, [ingredients, search]);

  if (isDesktop) {
    return <Redirect href={'/(main)/ingredients' as import('expo-router').Href} />;
  }

  return (
    <ScrollView
      className="flex-1 bg-surface dark:bg-surface-dark"
      contentContainerClassName={`flex-grow ${pagePaddingClass(false)}`}>
      <View className={`${pageHeaderMarginClass(false)} flex-row items-start justify-between gap-3`}>
        <View className="flex-1">
          <Heading level={2}>Ingredients</Heading>
          <Text variant="caption" className="mt-0.5">
            Your master catalog of store products, prices, and units.
          </Text>
        </View>
        <Button label="Add" onPress={() => router.push('/(main)/ingredients/new' as Href)} />
      </View>

      <Input
        value={search}
        onChangeText={setSearch}
        placeholder="Search ingredients"
        className="mb-3"
      />

      {isLoading ? (
        <ActivityIndicator className="mt-4" />
      ) : filteredIngredients.length === 0 ? (
        <EmptyState
          title="No ingredients yet"
          description="Add store products with purchase price, quantity, and stock units."
          actionLabel="Add ingredient"
          onAction={() => router.push('/(main)/ingredients/new' as Href)}
        />
      ) : (
        <View className="overflow-hidden rounded-card border border-border dark:border-border-dark">
          {filteredIngredients.map((ingredient) => (
            <MasterListRow
              key={ingredient.id}
              title={ingredient.name}
              subtitle={getIngredientDisplayName(ingredient)}
              meta={`${ingredient.category} · ${formatPurchaseSummary(ingredient)}`}
              imageUrl={ingredient.image_url}
              showThumbnail
              accessory={<IngredientPantryToggle ingredientId={ingredient.id} />}
              onPress={() => router.push(`/(main)/ingredients/${ingredient.id}` as Href)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
