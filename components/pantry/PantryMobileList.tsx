import { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';

import { PantryMobileRow, showAddToCartPlaceholder } from '@/components/pantry/PantryMobileRow';
import { useInventoryMutations } from '@/hooks/useInventory';
import { getIngredientDisplayName } from '@/lib/ingredients';
import type { PantryItem } from '@/lib/inventory/pantry';
import { pagePaddingClass } from '@/constants/theme';

type PantryMobileListProps = {
  items: PantryItem[];
  onAdjustStock: (item: PantryItem) => void;
};

export function PantryMobileList({ items, onAdjustStock }: PantryMobileListProps) {
  const { update } = useInventoryMutations();
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set());
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const toggleChecked = useCallback((id: string) => {
    setCheckedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const adjustQuantity = useCallback(
    async (item: PantryItem, delta: number) => {
      const nextQuantity = Math.max(0, item.quantity + delta);
      if (nextQuantity === item.quantity) {
        return;
      }

      setUpdatingId(item.id);
      try {
        await update.mutateAsync({
          id: item.id,
          input: { quantity: nextQuantity },
        });
      } finally {
        setUpdatingId(null);
      }
    },
    [update],
  );

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PantryMobileRow
          item={item}
          isChecked={checkedIds.has(item.id)}
          onToggleChecked={() => toggleChecked(item.id)}
          onAdjustStock={() => onAdjustStock(item)}
          onIncrement={() => void adjustQuantity(item, 1)}
          onDecrement={() => void adjustQuantity(item, -1)}
          onAddToCart={() => showAddToCartPlaceholder(getIngredientDisplayName(item))}
          isUpdating={updatingId === item.id}
        />
      )}
      ItemSeparatorComponent={() => <View className="h-3" />}
      contentContainerClassName={`${pagePaddingClass(false)} pt-3 pb-6`}
      className="flex-1"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    />
  );
}
