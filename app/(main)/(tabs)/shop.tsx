import { ActivityIndicator, View } from 'react-native';

import { ShopMobileList } from '@/components/shop/ShopMobileList';
import { EmptyState } from '@/components/ui';
import { Heading, Text } from '@/components/ui/Text';
import { pageHeaderMarginClass, pagePaddingClass } from '@/constants/theme';
import { useShoppingList } from '@/hooks/useShoppingList';
import { useResponsive } from '@/hooks/useResponsive';

export default function ShopScreen() {
  const { isDesktop } = useResponsive();
  const { data: items = [], isLoading } = useShoppingList();

  const activeCount = items.filter((item) => !item.is_purchased).length;

  if (isDesktop) {
    return (
      <View className={`flex-1 bg-surface dark:bg-surface-dark ${pagePaddingClass(true)}`}>
        <View className={pageHeaderMarginClass(true)}>
          <Heading level={2}>Shop</Heading>
          <Text variant="caption" className="mt-0.5">
            Use the Shop tab on your phone while shopping. Desktop view coming later.
          </Text>
        </View>
        {isLoading ? (
          <ActivityIndicator className="mt-8" />
        ) : items.length === 0 ? (
          <EmptyState
            title="Nothing to buy yet"
            description="Add items from Pantry when stock is low."
          />
        ) : (
          <ShopMobileList items={items} />
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark">
      <View className={`border-b border-border dark:border-border-dark ${pagePaddingClass(false)} pb-3`}>
        <View className={pageHeaderMarginClass(false)}>
          <Heading level={2}>Shop</Heading>
          <Text variant="caption" className="mt-0.5">
            {activeCount > 0
              ? `${activeCount} item${activeCount === 1 ? '' : 's'} to buy`
              : 'Add items from Pantry when stock is low.'}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator className="mt-8" />
      ) : items.length === 0 ? (
        <View className={pagePaddingClass(false)}>
          <EmptyState
            title="Nothing to buy yet"
            description="Tap Add to cart on Pantry items when you need to restock."
          />
        </View>
      ) : (
        <ShopMobileList items={items} />
      )}
    </View>
  );
}
