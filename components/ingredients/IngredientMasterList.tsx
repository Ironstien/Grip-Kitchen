import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView } from 'react-native';
import { Href, usePathname, useRouter } from 'expo-router';

import {
  MasterListEmpty,
  MasterListPane,
  MasterListRow,
} from '@/components/layout/MasterListPane';
import { Input } from '@/components/ui/Input';
import { useIngredients } from '@/hooks/useIngredients';
import { getIngredientDisplayName } from '@/lib/ingredients';

function getSelectedIngredientId(pathname: string): string | null {
  const match = pathname.match(/\/ingredients\/([^/]+)/);
  if (!match || match[1] === 'new') {
    return null;
  }
  return match[1];
}

export function IngredientMasterList() {
  const router = useRouter();
  const pathname = usePathname();
  const selectedId = getSelectedIngredientId(pathname);
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

  return (
    <MasterListPane
      title="All Ingredients"
      createLabel="Add ingredient"
      onCreate={() => router.push('/(main)/ingredients/new' as Href)}
      filters={
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search ingredients"
          className="mb-0"
        />
      }>
      {isLoading ? (
        <ActivityIndicator className="mt-6" />
      ) : filteredIngredients.length === 0 ? (
        <MasterListEmpty
          message={
            ingredients.length === 0
              ? 'No ingredients yet. Add your first item.'
              : 'No ingredients match your search.'
          }
        />
      ) : (
        <ScrollView className="flex-1">
          {filteredIngredients.map((ingredient) => (
            <MasterListRow
              key={ingredient.id}
              title={ingredient.name}
              subtitle={
                ingredient.display_name && ingredient.display_name !== ingredient.name
                  ? getIngredientDisplayName(ingredient)
                  : ingredient.category
              }
              meta={ingredient.category}
              imageUrl={ingredient.image_url}
              showThumbnail
              selected={selectedId === ingredient.id}
              onPress={() => router.push(`/(main)/ingredients/${ingredient.id}` as Href)}
            />
          ))}
        </ScrollView>
      )}
    </MasterListPane>
  );
}
