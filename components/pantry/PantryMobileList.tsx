import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, View, type FlatList as FlatListType } from 'react-native';

import { PantryMobileRow } from '@/components/pantry/PantryMobileRow';
import { PantryStockSheet } from '@/components/pantry/PantryStockSheet';
import { useAddToCart } from '@/hooks/useAddToCart';
import { useInventoryMutations } from '@/hooks/useInventory';
import type { PantryItem } from '@/lib/inventory/pantry';
import { pagePaddingClass } from '@/constants/theme';

type PantryMobileListProps = {
  items: PantryItem[];
};

export function PantryMobileList({ items }: PantryMobileListProps) {
  const { update } = useInventoryMutations();
  const addToCart = useAddToCart();
  const listRef = useRef<FlatListType<PantryItem>>(null);
  const scrollOffsetRef = useRef(0);
  const restoreScrollOffsetRef = useRef<number | null>(null);
  const isRestoringScrollRef = useRef(false);

  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set());
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const editingItem =
    editingItemId !== null ? items.find((item) => item.id === editingItemId) ?? null : null;

  const restoreScrollPosition = useCallback(() => {
    const offset = restoreScrollOffsetRef.current;
    if (offset === null) {
      return;
    }

    isRestoringScrollRef.current = true;
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset, animated: false });
      isRestoringScrollRef.current = false;
    });
  }, []);

  const openSheet = useCallback((item: PantryItem) => {
    restoreScrollOffsetRef.current = scrollOffsetRef.current;
    setEditingItemId(item.id);
  }, []);

  const closeSheet = useCallback(() => {
    setEditingItemId(null);
  }, []);

  useEffect(() => {
    if (editingItemId === null) {
      restoreScrollPosition();
    }
  }, [editingItemId, items, restoreScrollPosition]);

  useEffect(() => {
    if (editingItemId && !items.some((item) => item.id === editingItemId)) {
      setEditingItemId(null);
    }
  }, [editingItemId, items]);

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
    <>
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PantryMobileRow
            item={item}
            isChecked={checkedIds.has(item.id)}
            onToggleChecked={() => toggleChecked(item.id)}
            onAdjustStock={() => openSheet(item)}
            onIncrement={() => void adjustQuantity(item, 1)}
            onDecrement={() => void adjustQuantity(item, -1)}
            onAddToCart={() => void addToCart(item)}
            isUpdating={updatingId === item.id}
          />
        )}
        ItemSeparatorComponent={() => <View className="h-3" />}
        contentContainerClassName={`${pagePaddingClass(false)} pt-3 pb-6`}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={(event) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          scrollOffsetRef.current = offsetY;

          if (
            editingItemId === null &&
            restoreScrollOffsetRef.current !== null &&
            !isRestoringScrollRef.current &&
            Math.abs(offsetY - restoreScrollOffsetRef.current) > 12
          ) {
            restoreScrollOffsetRef.current = null;
          }
        }}
        scrollEventThrottle={16}
      />

      <PantryStockSheet item={editingItem} onClose={closeSheet} />
    </>
  );
}
