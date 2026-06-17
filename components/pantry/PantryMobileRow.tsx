import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IngredientThumbnail } from '@/components/ui/IngredientThumbnail';
import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/contexts/ThemeContext';
import { formatExpirationDate, getExpiryStatus } from '@/lib/inventory/expiry';
import { getIngredientDisplayName } from '@/lib/ingredients';
import type { PantryItem } from '@/lib/inventory/pantry';
import {
  getStockLevel,
  stockLevelBorderClasses,
  stockLevelQtyClasses,
} from '@/lib/inventory/stockStatus';
import { formatQuantity } from '@/lib/units';
import { cn } from '@/lib/cn';

type PantryMobileRowProps = {
  item: PantryItem;
  isChecked: boolean;
  onToggleChecked: () => void;
  onAdjustStock: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onAddToCart: () => void;
  isUpdating?: boolean;
};

export function PantryMobileRow({
  item,
  isChecked,
  onToggleChecked,
  onAdjustStock,
  onIncrement,
  onDecrement,
  onAddToCart,
  isUpdating = false,
}: PantryMobileRowProps) {
  const { palette } = useTheme();
  const stockLevel = getStockLevel(item);
  const expiryStatus = getExpiryStatus(item.expiration_date);
  const showExpiry =
    expiryStatus === 'expiring' || expiryStatus === 'expired' ? item.expiration_date : null;

  return (
    <Card className={cn('gap-3', stockLevelBorderClasses[stockLevel], isChecked && 'opacity-70')}>
      <View className="flex-row gap-3">
        <IngredientThumbnail uri={item.image_url} size={52} />

        <Pressable
          onPress={onAdjustStock}
          className="min-w-0 flex-1 justify-center active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel={`${getIngredientDisplayName(item)}, ${formatQuantity(item.quantity, item.stock_unit)}`}>
          <View className="flex-row items-start justify-between gap-2">
            <View className="min-w-0 flex-1">
              <Text className="text-base font-semibold" numberOfLines={2}>
                {getIngredientDisplayName(item)}
              </Text>
              <Text
                className={cn('mt-0.5 text-2xl font-bold tabular-nums', stockLevelQtyClasses[stockLevel])}>
                {formatQuantity(item.quantity, item.stock_unit)}
              </Text>
              {stockLevel !== 'ok' && item.min_threshold > 0 ? (
                <Text variant="caption" className="mt-0.5 text-status-warning">
                  min {formatQuantity(item.min_threshold, item.stock_unit)}
                </Text>
              ) : null}
              {showExpiry ? (
                <Text
                  variant="caption"
                  className={cn(
                    'mt-0.5',
                    expiryStatus === 'expired' ? 'text-status-danger' : 'text-status-warning',
                  )}>
                  Expires {formatExpirationDate(showExpiry)}
                </Text>
              ) : null}
            </View>

            {isChecked ? (
              <View className="mt-1 h-7 w-7 items-center justify-center rounded-full bg-status-success/15">
                <Ionicons name="checkmark" size={18} color={palette.statusSuccess} />
              </View>
            ) : null}
          </View>
        </Pressable>

        <View className="items-center justify-center gap-1">
          <IconButton
            name="add"
            size={20}
            className="h-10 w-10 bg-field dark:bg-field-dark"
            onPress={onIncrement}
            disabled={isUpdating}
            accessibilityLabel="Increase quantity"
          />
          <IconButton
            name="remove"
            size={20}
            className="h-10 w-10 bg-field dark:bg-field-dark"
            onPress={onDecrement}
            disabled={isUpdating || item.quantity <= 0}
            accessibilityLabel="Decrease quantity"
          />
        </View>
      </View>

      <View className="flex-row gap-2">
        <Button
          label={isChecked ? 'Checked' : 'Mark OK'}
          variant={isChecked ? 'secondary' : 'ghost'}
          onPress={onToggleChecked}
          className="flex-1"
          textClassName="text-xs"
        />
        <Button
          label="Add to cart"
          variant="ghost"
          onPress={onAddToCart}
          className="flex-1"
          textClassName="text-xs"
        />
      </View>
    </Card>
  );
}
