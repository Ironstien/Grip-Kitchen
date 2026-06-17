import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Href, Redirect, useRouter } from 'expo-router';

import { LocationFilterTabs } from '@/components/pantry/LocationFilterTabs';
import { PantryMobileList } from '@/components/pantry/PantryMobileList';
import { PantryHeaderActions } from '@/components/pantry/PantrySortMenu';
import { EmptyState } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Heading, Text } from '@/components/ui/Text';
import { pageHeaderMarginClass, pagePaddingClass } from '@/constants/theme';
import { useInventory } from '@/hooks/useInventory';
import { useStorageLocations } from '@/hooks/useStorageLocations';
import { useResponsive } from '@/hooks/useResponsive';
import { getIngredientDisplayName } from '@/lib/ingredients';
import { sortPantryItems, type PantrySortMode } from '@/lib/inventory/sortPantryItems';

export default function PantryScreen() {
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [hasInitializedLocation, setHasInitializedLocation] = useState(false);
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<PantrySortMode>('shelf');

  const { data: locations = [], isLoading: locationsLoading } = useStorageLocations();
  const { data: items = [], isLoading: itemsLoading } = useInventory(selectedLocationId);

  useEffect(() => {
    if (!hasInitializedLocation && locations.length > 0) {
      setSelectedLocationId(locations[0].id);
      setHasInitializedLocation(true);
    }
  }, [hasInitializedLocation, locations]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const searched = query
      ? items.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            getIngredientDisplayName(item).toLowerCase().includes(query),
        )
      : items;

    return sortPantryItems(searched, sortMode);
  }, [items, search, sortMode]);

  if (isDesktop) {
    return <Redirect href={'/(main)/inventory' as import('expo-router').Href} />;
  }

  const isLoading = locationsLoading || itemsLoading;
  const paddingClass = pagePaddingClass(false);

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark">
      <View className={`border-b border-border dark:border-border-dark ${paddingClass} pb-3`}>
        <View className={`${pageHeaderMarginClass(false)} flex-row items-start justify-between gap-3`}>
          <View className="min-w-0 flex-1">
            <Heading level={2}>Pantry</Heading>
            <Text variant="caption" className="mt-0.5">
              Check stock as you walk. Edit details in Ingredients.
            </Text>
          </View>
          <PantryHeaderActions sortMode={sortMode} onSortChange={setSortMode} />
        </View>

        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search pantry"
          className="mb-3"
        />

        <LocationFilterTabs
          locations={locations}
          selectedLocationId={selectedLocationId}
          onSelect={setSelectedLocationId}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator className="mt-8" />
      ) : filteredItems.length === 0 ? (
        <View className={paddingClass}>
          <EmptyState
            title="Nothing in pantry yet"
            description="Add ingredients from your master list to start tracking stock and expiry."
            actionLabel="Add to pantry"
            onAction={() => router.push('/(main)/inventory/new' as Href)}
          />
        </View>
      ) : (
        <PantryMobileList
          key={selectedLocationId ?? 'all'}
          items={filteredItems}
          onAdjustStock={(item) => router.push(`/(main)/inventory/${item.id}` as Href)}
        />
      )}
    </View>
  );
}
