import { Alert, Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useInventoryMutations } from '@/hooks/useInventory';
import { formatExpirationDate, getExpiryLabel, getExpiryStatus } from '@/lib/inventory/expiry';
import type { PantryItem } from '@/lib/inventory/pantry';
import { formatQuantity } from '@/lib/units';
import { cn } from '@/lib/cn';
import type { StorageLocation } from '@/types/database';

type PantryMobileListProps = {
  items: PantryItem[];
  locations: StorageLocation[];
  onAdjustStock: (item: PantryItem) => void;
};

const expiryRowClasses = {
  ok: '',
  expiring: 'border-l-4 border-l-status-warning',
  expired: 'border-l-4 border-l-status-danger',
  none: '',
};

const expiryBadgeStatus = {
  ok: 'success',
  expiring: 'warning',
  expired: 'danger',
  none: 'neutral',
} as const;

export function PantryMobileList({ items, locations, onAdjustStock }: PantryMobileListProps) {
  const { remove } = useInventoryMutations();
  const locationMap = new Map(locations.map((location) => [location.id, location.name]));

  const handleRemove = (item: PantryItem) => {
    Alert.alert('Remove from pantry', `Remove ${item.name} from your pantry?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void remove.mutateAsync(item.id);
        },
      },
    ]);
  };

  return (
    <View className="gap-3">
      {items.map((item) => {
        const expiryStatus = getExpiryStatus(item.expiration_date);
        const locationName = item.location_id
          ? locationMap.get(item.location_id) ?? 'Unknown'
          : 'Unassigned';

        return (
          <Card key={item.id} className={cn('gap-3', expiryRowClasses[expiryStatus])}>
            <Pressable onPress={() => onAdjustStock(item)} className="gap-2">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-lg font-semibold">{item.name}</Text>
                  <Text variant="bodySecondary">
                    {formatQuantity(item.quantity, item.unit_of_measure)} · {item.category}
                  </Text>
                  <Text variant="caption" className="mt-1">
                    {locationName}
                    {item.expiration_date
                      ? ` · Expires ${formatExpirationDate(item.expiration_date)}`
                      : ''}
                  </Text>
                </View>
                <Badge
                  label={getExpiryLabel(expiryStatus)}
                  status={expiryBadgeStatus[expiryStatus]}
                />
              </View>
            </Pressable>
            <Button label="Remove from pantry" variant="ghost" onPress={() => handleRemove(item)} />
          </Card>
        );
      })}
    </View>
  );
}
