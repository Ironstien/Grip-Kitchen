import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { getIngredientDisplayName } from '@/lib/ingredients';
import type { ShoppingListEntry } from '@/lib/services/shoppingList';

type ShopItemEditSheetProps = {
  visible: boolean;
  item: ShoppingListEntry | null;
  onClose: () => void;
  onSave: (quantity: number) => void;
  isSaving?: boolean;
};

export function ShopItemEditSheet({
  visible,
  item,
  onClose,
  onSave,
  isSaving = false,
}: ShopItemEditSheetProps) {
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    if (visible && item) {
      setQuantity(String(item.target_quantity));
    }
  }, [visible, item]);

  const parsed = Number(quantity);
  const isValid = Number.isFinite(parsed) && parsed > 0;

  const handleSave = () => {
    if (!isValid) {
      return;
    }
    onSave(parsed);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={item ? `Edit ${getIngredientDisplayName(item)}` : 'Edit item'}>
      <View className="gap-3 pb-2">
        <View>
          <Text variant="label" className="mb-1">
            Quantity to buy{item ? ` (${item.stock_unit})` : ''}
          </Text>
          <Input
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
            placeholder="1"
          />
        </View>

        <View className="flex-row gap-2">
          <Button label="Cancel" variant="ghost" onPress={onClose} className="flex-1" />
          <Button
            label={isSaving ? 'Saving…' : 'Save'}
            onPress={handleSave}
            disabled={!isValid || isSaving}
            className="flex-1"
          />
        </View>
      </View>
    </BottomSheet>
  );
}
