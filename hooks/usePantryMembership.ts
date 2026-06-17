import { useMemo } from 'react';
import { Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useInventory } from '@/hooks/useInventory';
import { useStorageLocations } from '@/hooks/useStorageLocations';
import {
  createInventoryItem,
  deleteInventoryByIngredientId,
  type PantryStockInsertInput,
} from '@/lib/services/inventory';

export function usePantryMembership() {
  const queryClient = useQueryClient();
  const { data: pantryItems = [] } = useInventory(null);
  const { data: locations = [] } = useStorageLocations();

  const inPantryIds = useMemo(
    () => new Set(pantryItems.map((item) => item.ingredient_id)),
    [pantryItems],
  );

  const invalidateInventory = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  };

  const addToPantry = useMutation({
    mutationFn: (ingredientId: string) => {
      const payload: PantryStockInsertInput = {
        ingredient_id: ingredientId,
        quantity: 0,
        location_id: locations[0]?.id ?? null,
        min_threshold: 0,
      };
      return createInventoryItem(payload);
    },
    onSuccess: invalidateInventory,
  });

  const removeFromPantry = useMutation({
    mutationFn: deleteInventoryByIngredientId,
    onSuccess: invalidateInventory,
  });

  const isInPantry = (ingredientId: string) => inPantryIds.has(ingredientId);

  const getPantryQuantity = (ingredientId: string) =>
    pantryItems
      .filter((item) => item.ingredient_id === ingredientId)
      .reduce((sum, item) => sum + item.quantity, 0);

  const setInPantry = async (ingredientId: string, enabled: boolean) => {
    if (enabled) {
      if (isInPantry(ingredientId)) {
        return;
      }

      await addToPantry.mutateAsync(ingredientId);
      return;
    }

    if (!isInPantry(ingredientId)) {
      return;
    }

    const totalQuantity = getPantryQuantity(ingredientId);
    if (totalQuantity > 0) {
      try {
        await new Promise<void>((resolve, reject) => {
          Alert.alert(
            'Remove from pantry?',
            'This ingredient still has stock recorded. Removing it clears all pantry rows for this item.',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => reject(new Error('cancelled')) },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: () => resolve(),
              },
            ],
          );
        });
      } catch {
        return;
      }
    }

    await removeFromPantry.mutateAsync(ingredientId);
  };

  const togglingIngredientId = addToPantry.isPending
    ? (addToPantry.variables ?? null)
    : removeFromPantry.isPending
      ? (removeFromPantry.variables ?? null)
      : null;

  return {
    inPantryIds,
    isInPantry,
    setInPantry,
    togglingIngredientId,
  };
}

export function useIngredientPantryStatus(ingredientId: string) {
  const { isInPantry, setInPantry, togglingIngredientId } = usePantryMembership();

  return {
    inPantry: isInPantry(ingredientId),
    setInPantry: (enabled: boolean) => setInPantry(ingredientId, enabled),
    isToggling: togglingIngredientId === ingredientId,
  };
}
