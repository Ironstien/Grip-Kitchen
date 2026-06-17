import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { ShopListHeader } from '@/components/shop/ShopListHeader';
import { ShopMobileList } from '@/components/shop/ShopMobileList';
import { EmptyState } from '@/components/ui';
import { Heading, Text } from '@/components/ui/Text';
import { pageHeaderMarginClass, pagePaddingClass } from '@/constants/theme';
import { useShoppingListItems, useShoppingLists } from '@/hooks/useShoppingList';
import { useResponsive } from '@/hooks/useResponsive';

export default function ShopScreen() {
  const { isDesktop } = useResponsive();
  const { data: activeLists = [], isLoading: listsLoading } = useShoppingLists('active');
  const [selectedListId, setSelectedListId] = useState<string | undefined>();

  useEffect(() => {
    if (!selectedListId && activeLists.length > 0) {
      setSelectedListId(activeLists[0].id);
    }
  }, [activeLists, selectedListId]);

  const { data: items = [], isLoading: itemsLoading } = useShoppingListItems(selectedListId);
  const activeCount = items.filter((item) => !item.is_purchased).length;
  const isLoading = listsLoading || itemsLoading;
  const paddingClass = pagePaddingClass(isDesktop);

  const emptyDescription =
    activeLists.length === 0
      ? 'Confirm a meal plan or add items from Pantry to start a list.'
      : 'This list is empty. Add items from Pantry or create one from the Planner.';

  if (isDesktop) {
    return (
      <View className={`flex-1 bg-surface dark:bg-surface-dark ${paddingClass}`}>
        <View className={pageHeaderMarginClass(true)}>
          <Heading level={2}>Shop</Heading>
          <Text variant="caption" className="mt-0.5">
            Manage named shopping lists and mark items purchased while you shop.
          </Text>
        </View>

        <ShopListHeader selectedListId={selectedListId} onSelectList={setSelectedListId} />

        {isLoading ? (
          <ActivityIndicator className="mt-8" />
        ) : !selectedListId || items.length === 0 ? (
          <EmptyState title="Nothing to buy yet" description={emptyDescription} />
        ) : (
          <ShopMobileList items={items} listId={selectedListId} />
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark">
      <View className={`border-b border-border dark:border-border-dark ${paddingClass} pb-3`}>
        <View className={pageHeaderMarginClass(false)}>
          <Heading level={2}>Shop</Heading>
          <Text variant="caption" className="mt-0.5">
            {activeCount > 0
              ? `${activeCount} item${activeCount === 1 ? '' : 's'} to buy`
              : 'Pick a list or add items from Pantry.'}
          </Text>
        </View>

        <ShopListHeader selectedListId={selectedListId} onSelectList={setSelectedListId} />
      </View>

      {isLoading ? (
        <ActivityIndicator className="mt-8" />
      ) : !selectedListId || items.length === 0 ? (
        <View className={paddingClass}>
          <EmptyState title="Nothing to buy yet" description={emptyDescription} />
        </View>
      ) : (
        <ShopMobileList items={items} listId={selectedListId} />
      )}
    </View>
  );
}
