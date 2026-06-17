import { useMemo, useState } from 'react';
import { Alert, Pressable, SectionList, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { IngredientThumbnail } from '@/components/ui/IngredientThumbnail';
import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/contexts/ThemeContext';
import { useShoppingListMutations } from '@/hooks/useShoppingList';
import { useResponsive } from '@/hooks/useResponsive';
import { copyTextToClipboard } from '@/lib/clipboardText';
import { getIngredientDisplayName } from '@/lib/ingredients';
import type { ShoppingListEntry } from '@/lib/services/shoppingList';
import { formatQuantity } from '@/lib/units';
import { pagePaddingClass } from '@/constants/theme';
import { cn } from '@/lib/cn';

type ShopSection = {
  title: string;
  data: ShoppingListEntry[];
};

type ShopMobileListProps = {
  items: ShoppingListEntry[];
  listId?: string;
};

function groupByCategory(items: ShoppingListEntry[]): ShopSection[] {
  const active = items.filter((item) => !item.is_purchased);
  const purchased = items.filter((item) => item.is_purchased);

  const buildSections = (entries: ShoppingListEntry[], purchasedSection: boolean) => {
    const map = new Map<string, ShoppingListEntry[]>();

    for (const entry of entries) {
      const group = map.get(entry.category) ?? [];
      group.push(entry);
      map.set(entry.category, group);
    }

    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([title, data]) => ({
        title: purchasedSection ? `Purchased · ${title}` : title,
        data: data.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  };

  return [...buildSections(active, false), ...buildSections(purchased, true)];
}

function ShopListRow({
  item,
  isDesktop,
  onTogglePurchased,
  onRemove,
}: {
  item: ShoppingListEntry;
  isDesktop?: boolean;
  onTogglePurchased: () => void;
  onRemove: () => void;
}) {
  const { palette } = useTheme();
  const [copied, setCopied] = useState(false);
  const storeName = item.name.trim();
  const displayName = getIngredientDisplayName(item);

  const handleCopyStoreName = async () => {
    if (!storeName) {
      Alert.alert('No store name', 'This item does not have a store product name set.');
      return;
    }

    const ok = await copyTextToClipboard(storeName);
    if (!ok) {
      Alert.alert('Copy failed', 'Could not copy the store name to your clipboard.');
      return;
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View
      className={cn(
        'flex-row items-center gap-3 border-b border-border py-3 dark:border-border-dark',
        item.is_purchased && 'opacity-60',
      )}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.is_purchased }}
        onPress={onTogglePurchased}
        className={cn(
          'h-6 w-6 items-center justify-center rounded border',
          item.is_purchased
            ? 'border-brand bg-brand dark:border-brand-dark'
            : 'border-border dark:border-border-dark',
        )}>
        {item.is_purchased ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
      </Pressable>

      <IngredientThumbnail uri={item.image_url} size={44} />

      <View className="min-w-0 flex-1">
        <Text className={cn('text-base font-semibold', item.is_purchased && 'line-through')}>
          {displayName}
        </Text>
        {isDesktop && storeName && storeName !== displayName ? (
          <Text variant="caption" numberOfLines={1}>
            Store: {storeName}
          </Text>
        ) : null}
        <Text variant="bodySecondary">
          Buy {formatQuantity(item.target_quantity, item.stock_unit)}
        </Text>
      </View>

      {isDesktop ? (
        <IconButton
          accessibilityLabel={copied ? 'Store name copied' : 'Copy store name'}
          name={copied ? 'checkmark-outline' : 'copy-outline'}
          iconColor={copied ? palette.statusSuccess : palette.textSecondary}
          onPress={() => void handleCopyStoreName()}
        />
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Remove from list"
        onPress={onRemove}
        className="h-8 w-8 items-center justify-center rounded-button active:opacity-70">
        <Ionicons name="trash-outline" size={18} color={palette.textSecondary} />
      </Pressable>
    </View>
  );
}

export function ShopMobileList({ items, listId }: ShopMobileListProps) {
  const { isDesktop } = useResponsive();
  const { update, remove } = useShoppingListMutations(listId);

  const sections = useMemo(() => groupByCategory(items), [items]);

  const handleRemove = (entry: ShoppingListEntry) => {
    Alert.alert('Remove from list', `Remove ${getIngredientDisplayName(entry)} from your Shop list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void remove.mutateAsync(entry.id);
        },
      },
    ]);
  };

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section: { title } }) => (
        <View className="bg-surface pb-1 pt-3 dark:bg-surface-dark">
          <Text variant="label">{title}</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <ShopListRow
          item={item}
          isDesktop={isDesktop}
          onTogglePurchased={() => {
            void update.mutateAsync({
              id: item.id,
              input: { is_purchased: !item.is_purchased },
            });
          }}
          onRemove={() => handleRemove(item)}
        />
      )}
      stickySectionHeadersEnabled
      contentContainerClassName={`${pagePaddingClass(isDesktop)} pb-8`}
      className="flex-1"
      showsVerticalScrollIndicator={false}
    />
  );
}
