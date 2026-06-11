import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView } from 'react-native';
import { Href, usePathname, useRouter } from 'expo-router';

import { LocationFilterTabs } from '@/components/pantry/LocationFilterTabs';
import {
  MasterListEmpty,
  MasterListPane,
  MasterListRow,
} from '@/components/layout/MasterListPane';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { getExpiryLabel, getExpiryStatus, formatExpirationDate } from '@/lib/inventory/expiry';
import { getIngredientDisplayName } from '@/lib/ingredients';
import { formatQuantity } from '@/lib/units';
import { useInventory } from '@/hooks/useInventory';
import { useStorageLocations } from '@/hooks/useStorageLocations';

function getSelectedItemId(pathname: string): string | null {
  const match = pathname.match(/\/inventory\/([^/]+)/);
  if (!match || match[1] === 'new') {
    return null;
  }
  return match[1];
}

export function PantryMasterList() {
  const router = useRouter();
  const pathname = usePathname();
  const selectedId = getSelectedItemId(pathname);

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data: locations = [], isLoading: locationsLoading } = useStorageLocations();
  const { data: items = [], isLoading: itemsLoading } = useInventory(selectedLocationId);

  const locationMap = useMemo(
    () => new Map(locations.map((location) => [location.id, location.name])),
    [locations],
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return items;
    }
    return items.filter((item) => item.name.toLowerCase().includes(query));
  }, [items, search]);

  const isLoading = locationsLoading || itemsLoading;

  return (
    <MasterListPane
      title="All Pantry Items"
      createLabel="Add to pantry"
      onCreate={() => router.push('/(main)/inventory/new' as Href)}
      filters={
        <ScrollView className="max-h-[140px]" showsVerticalScrollIndicator={false}>
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Search pantry"
            className="mb-2"
          />
          <LocationFilterTabs
            locations={locations}
            selectedLocationId={selectedLocationId}
            onSelect={setSelectedLocationId}
          />
        </ScrollView>
      }>
      {isLoading ? (
        <ActivityIndicator className="mt-6" />
      ) : filteredItems.length === 0 ? (
        <MasterListEmpty message="Nothing in pantry yet." />
      ) : (
        <ScrollView className="flex-1">
          {filteredItems.map((item) => {
            const expiryStatus = getExpiryStatus(item.expiration_date);
            const locationName = item.location_id
              ? locationMap.get(item.location_id) ?? 'Unknown'
              : 'Unassigned';

            return (
              <MasterListRow
                key={item.id}
                title={getIngredientDisplayName(item)}
                subtitle={locationName}
                meta={formatQuantity(item.quantity, item.stock_unit)}
                trailing={
                  item.expiration_date
                    ? formatExpirationDate(item.expiration_date)
                    : undefined
                }
                badge={
                  expiryStatus !== 'none' && expiryStatus !== 'ok' ? (
                    <Badge
                      label={getExpiryLabel(expiryStatus)}
                      status={expiryStatus === 'expired' ? 'danger' : 'warning'}
                    />
                  ) : undefined
                }
                selected={selectedId === item.id}
                onPress={() => router.push(`/(main)/inventory/${item.id}` as Href)}
              />
            );
          })}
        </ScrollView>
      )}
    </MasterListPane>
  );
}
