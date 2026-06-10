import { useMemo, useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useInventoryMutations } from '@/hooks/useInventory';
import { formatExpirationDate, getExpiryStatus } from '@/lib/inventory/expiry';
import type { PantryItem } from '@/lib/inventory/pantry';
import { getIngredientDisplayName, formatPurchaseSummary } from '@/lib/ingredients';
import { cn } from '@/lib/cn';
import type { StorageLocation } from '@/types/database';

type SortKey =
  | 'name'
  | 'category'
  | 'location'
  | 'quantity'
  | 'stock_unit'
  | 'purchase_price'
  | 'expiration_date'
  | 'min_threshold';

type PantryDesktopSpreadsheetProps = {
  items: PantryItem[];
  locations: StorageLocation[];
  onAdjustStock: (item: PantryItem) => void;
};

const columns: Array<{ key: SortKey; label: string; flex: number; editable: boolean }> = [
  { key: 'name', label: 'Name', flex: 2, editable: false },
  { key: 'category', label: 'Category', flex: 1.2, editable: false },
  { key: 'location', label: 'Location', flex: 1.2, editable: true },
  { key: 'quantity', label: 'Qty', flex: 0.8, editable: true },
  { key: 'stock_unit', label: 'Unit', flex: 0.8, editable: false },
  { key: 'purchase_price', label: 'Purchase', flex: 1.4, editable: false },
  { key: 'expiration_date', label: 'Expiry', flex: 1.2, editable: true },
  { key: 'min_threshold', label: 'Min', flex: 0.7, editable: true },
];

export function PantryDesktopSpreadsheet({
  items,
  locations,
  onAdjustStock,
}: PantryDesktopSpreadsheetProps) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ id: string; key: SortKey } | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const { update, removeMany } = useInventoryMutations();

  const locationMap = useMemo(
    () => new Map(locations.map((location) => [location.id, location.name])),
    [locations],
  );

  const sortedItems = useMemo(() => {
    const copy = [...items];

    copy.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      if (sortKey === 'location') {
        aValue = a.location_id ? locationMap.get(a.location_id) ?? '' : '';
        bValue = b.location_id ? locationMap.get(b.location_id) ?? '' : '';
      } else {
        aValue = (a[sortKey as keyof PantryItem] as string | number | null) ?? '';
        bValue = (b[sortKey as keyof PantryItem] as string | number | null) ?? '';
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortAsc ? aValue - bValue : bValue - aValue;
      }

      return sortAsc
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

    return copy;
  }, [items, locationMap, sortAsc, sortKey]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((value) => !value);
      return;
    }

    setSortKey(key);
    setSortAsc(true);
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const startEditing = (item: PantryItem, key: SortKey, value: string) => {
    const column = columns.find((entry) => entry.key === key);
    if (!column?.editable) {
      return;
    }

    if (key === 'location') {
      onAdjustStock(item);
      return;
    }

    setEditingCell({ id: item.id, key });
    setDraftValue(value);
  };

  const commitEdit = async () => {
    if (!editingCell) {
      return;
    }

    const item = items.find((entry) => entry.id === editingCell.id);
    if (!item) {
      setEditingCell(null);
      return;
    }

    try {
      if (editingCell.key === 'quantity' || editingCell.key === 'min_threshold') {
        const parsed = Number(draftValue);
        if (Number.isNaN(parsed) || parsed < 0) {
          Alert.alert('Invalid value', 'Enter a valid number.');
          return;
        }
        await update.mutateAsync({ id: item.id, input: { [editingCell.key]: parsed } });
      } else if (editingCell.key === 'expiration_date') {
        await update.mutateAsync({
          id: item.id,
          input: { expiration_date: draftValue.trim() || null },
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update failed.';
      Alert.alert('Update failed', message);
    } finally {
      setEditingCell(null);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) {
      return;
    }

    Alert.alert('Remove from pantry', `Remove ${selectedIds.size} selected item(s) from pantry?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void removeMany.mutateAsync(Array.from(selectedIds)).then(() => setSelectedIds(new Set()));
        },
      },
    ]);
  };

  return (
    <View className="w-full gap-2">
      {selectedIds.size > 0 && (
        <View className="flex-row items-center justify-between">
          <Text variant="label">{selectedIds.size} selected</Text>
          <Button label="Remove selected" variant="ghost" onPress={handleBulkDelete} />
        </View>
      )}

      <View className="w-full">
        <View className="w-full flex-row border-b border-border bg-surface-secondary px-2 py-1.5 dark:border-border-dark dark:bg-surface-dark-secondary">
          <View className="w-10" />
          {columns.map((column) => (
            <Pressable
              key={column.key}
              style={{ flex: column.flex }}
              onPress={() => toggleSort(column.key)}
              className="px-2">
              <Text variant="label">
                {column.label}
                {sortKey === column.key ? (sortAsc ? ' ↑' : ' ↓') : ''}
              </Text>
            </Pressable>
          ))}
          <View className="w-24 px-2">
            <Text variant="label">Status</Text>
          </View>
        </View>

        {sortedItems.map((item) => {
          const expiryStatus = getExpiryStatus(item.expiration_date);
          const rowClass =
            expiryStatus === 'expired'
              ? 'bg-status-danger/5'
              : expiryStatus === 'expiring'
                ? 'bg-status-warning/5'
                : '';

          return (
            <View
              key={item.id}
              className={cn(
                'w-full flex-row items-center border-b border-border px-2 py-1.5 dark:border-border-dark',
                rowClass,
              )}>
              <Pressable onPress={() => toggleSelected(item.id)} className="w-10 items-center">
                <View
                  className={cn(
                    'h-4 w-4 rounded border border-border dark:border-border-dark',
                    selectedIds.has(item.id) && 'bg-brand dark:bg-brand-dark',
                  )}
                />
              </Pressable>

              {columns.map((column) => {
                const rawValue =
                  column.key === 'location'
                    ? item.location_id
                      ? locationMap.get(item.location_id) ?? ''
                      : ''
                    : column.key === 'expiration_date'
                      ? item.expiration_date ?? ''
                      : column.key === 'purchase_price'
                        ? formatPurchaseSummary(item)
                      : column.key === 'name'
                        ? getIngredientDisplayName(item)
                        : String(item[column.key as keyof PantryItem] ?? '');

                const isEditing =
                  editingCell?.id === item.id && editingCell.key === column.key;

                return (
                  <Pressable
                    key={column.key}
                    style={{ flex: column.flex }}
                    onPress={() => startEditing(item, column.key, rawValue)}
                    className="px-2">
                    {isEditing ? (
                      <TextInput
                        autoFocus
                        value={draftValue}
                        onChangeText={setDraftValue}
                        onBlur={() => void commitEdit()}
                        onSubmitEditing={() => void commitEdit()}
                        className="rounded border border-brand px-1.5 py-0.5 text-xs text-text dark:text-text-dark"
                      />
                    ) : (
                      <Text className="text-xs">
                        {column.key === 'expiration_date'
                          ? formatExpirationDate(item.expiration_date)
                          : rawValue}
                      </Text>
                    )}
                  </Pressable>
                );
              })}

              <View className="w-24 px-2">
                <Badge
                  label={expiryStatus === 'expired' ? 'Expired' : expiryStatus === 'expiring' ? 'Soon' : 'OK'}
                  status={
                    expiryStatus === 'expired'
                      ? 'danger'
                      : expiryStatus === 'expiring'
                        ? 'warning'
                        : 'success'
                  }
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
