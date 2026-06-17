import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useShoppingListMutations } from '@/hooks/useShoppingList';
import { getIngredientDisplayName } from '@/lib/ingredients';
import type { PantryItem } from '@/lib/inventory/pantry';
import { findActiveShoppingListEntry, getOrCreateDefaultShoppingList } from '@/lib/services/shoppingList';
import { suggestBuyQuantity } from '@/lib/shopping/addToCart';
import { formatQuantity } from '@/lib/units';

export function useAddToCart() {
  const { create, update } = useShoppingListMutations();

  return useCallback(
    async (item: PantryItem) => {
      const list = await getOrCreateDefaultShoppingList();
      const buyQuantity = suggestBuyQuantity(item);
      const label = getIngredientDisplayName(item);
      const quantityLabel = formatQuantity(buyQuantity, item.stock_unit);
      const existing = await findActiveShoppingListEntry(list.id, item.id);

      if (!existing) {
        await create.mutateAsync({
          shopping_list_id: list.id,
          inventory_item_id: item.id,
          target_quantity: buyQuantity,
        });
        Alert.alert('Added to cart', `${label} · ${quantityLabel}`);
        return;
      }

      const existingLabel = formatQuantity(existing.target_quantity, item.stock_unit);

      Alert.alert(
        'Already on list',
        `${label} is already on your Shop list (${existingLabel}).`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add another',
            onPress: () => {
              void create
                .mutateAsync({
                  shopping_list_id: list.id,
                  inventory_item_id: item.id,
                  target_quantity: buyQuantity,
                })
                .then(() => {
                  Alert.alert('Added to cart', `${label} · ${quantityLabel}`);
                });
            },
          },
          {
            text: 'Update quantity',
            onPress: () => {
              void update
                .mutateAsync({
                  id: existing.id,
                  input: { target_quantity: existing.target_quantity + buyQuantity },
                })
                .then(() => {
                  Alert.alert(
                    'Updated cart',
                    `${label} · ${formatQuantity(existing.target_quantity + buyQuantity, item.stock_unit)}`,
                  );
                });
            },
          },
        ],
      );
    },
    [create, update],
  );
}
