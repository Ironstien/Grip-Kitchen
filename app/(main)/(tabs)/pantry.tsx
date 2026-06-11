import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Href, Redirect, useRouter } from 'expo-router';

import { LocationFilterTabs } from '@/components/pantry/LocationFilterTabs';
import { PantryMobileList } from '@/components/pantry/PantryMobileList';
import { EmptyState } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Heading, Text } from '@/components/ui/Text';
import { pageHeaderMarginClass, pagePaddingClass } from '@/constants/theme';
import { useInventory } from '@/hooks/useInventory';
import { useStorageLocations } from '@/hooks/useStorageLocations';
import { useResponsive } from '@/hooks/useResponsive';

export default function PantryScreen() {
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data: locations = [], isLoading: locationsLoading } = useStorageLocations();
  const { data: items = [], isLoading: itemsLoading } = useInventory(selectedLocationId);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return items;
    }

    return items.filter((item) => item.name.toLowerCase().includes(query));
  }, [items, search]);

  if (isDesktop) {
    return <Redirect href={'/(main)/inventory' as import('expo-router').Href} />;
  }

  const isLoading = locationsLoading || itemsLoading;

  return (
    <ScrollView
      className="flex-1 bg-surface dark:bg-surface-dark"
      contentContainerClassName={`flex-grow ${pagePaddingClass(false)}`}>
      <View className={pageHeaderMarginClass(false)}>
        <Heading level={2}>Pantry</Heading>
        <Text variant="caption" className="mt-0.5">
          Add or remove stock. Edit ingredient details in Ingredients.
        </Text>
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

      {isLoading ? (
        <ActivityIndicator className="mt-8" />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="Nothing in pantry yet"
          description="Add ingredients from your master list to start tracking stock and expiry."
          actionLabel="Add to pantry"
          onAction={() => router.push('/(main)/inventory/new' as Href)}
        />
      ) : (
        <PantryMobileList
          items={filteredItems}
          locations={locations}
          onAdjustStock={(item) => router.push(`/(main)/inventory/${item.id}` as Href)}
        />
      )}
    </ScrollView>
  );
}
