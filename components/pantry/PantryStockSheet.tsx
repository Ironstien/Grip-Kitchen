import { PantryStockForm } from '@/components/pantry/PantryStockForm';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { getIngredientDisplayName } from '@/lib/ingredients';
import type { PantryItem } from '@/lib/inventory/pantry';

type PantryStockSheetProps = {
  item: PantryItem | null;
  onClose: () => void;
};

export function PantryStockSheet({ item, onClose }: PantryStockSheetProps) {
  return (
    <BottomSheet
      visible={item !== null}
      onClose={onClose}
      title={item ? getIngredientDisplayName(item) : undefined}>
      {item ? (
        <PantryStockForm
          key={item.id}
          item={item}
          dense
          inSheet
          onSaved={onClose}
          onCancel={onClose}
        />
      ) : null}
    </BottomSheet>
  );
}
