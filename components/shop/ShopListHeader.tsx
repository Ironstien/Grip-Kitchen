import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/contexts/ThemeContext';
import { useShoppingListMutations, useShoppingLists } from '@/hooks/useShoppingList';
import type { ShoppingListSession } from '@/types/database';
import { cn } from '@/lib/cn';

type ShopListHeaderProps = {
  selectedListId?: string;
  onSelectList: (listId: string | undefined) => void;
};

export function ShopListHeader({ selectedListId, onSelectList }: ShopListHeaderProps) {
  const { palette } = useTheme();
  const { data: activeLists = [] } = useShoppingLists('active');
  const { data: archivedLists = [] } = useShoppingLists('archived');
  const { createList, renameList, archiveList, deleteList } = useShoppingListMutations(selectedListId);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const selectedList = useMemo(
    () => activeLists.find((list) => list.id === selectedListId) ?? activeLists[0],
    [activeLists, selectedListId],
  );

  const selectAfterDelete = (deletedId: string) => {
    const remaining = activeLists.filter((list) => list.id !== deletedId);
    onSelectList(remaining[0]?.id);
  };

  const openRename = () => {
    if (!selectedList) {
      return;
    }
    setRenameValue(selectedList.name);
    setRenameOpen(true);
  };

  const handleRename = async () => {
    if (!selectedList || !renameValue.trim()) {
      return;
    }
    await renameList.mutateAsync({ id: selectedList.id, name: renameValue.trim() });
    setRenameOpen(false);
  };

  const handleArchive = () => {
    if (!selectedList) {
      return;
    }

    Alert.alert(
      'Confirm shopping done',
      `Archive "${selectedList.name}"? You can still view it in past lists.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: () => {
            void archiveList.mutateAsync(selectedList.id).then(() => {
              selectAfterDelete(selectedList.id);
            });
          },
        },
      ],
    );
  };

  const confirmDeleteList = (list: ShoppingListSession) => {
    Alert.alert(
      'Delete shopping list',
      `Permanently delete "${list.name}" and all its items?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteList.mutateAsync(list.id).then(() => {
              if (list.id === selectedListId) {
                selectAfterDelete(list.id);
              }
            });
          },
        },
      ],
    );
  };

  const handleNewList = async () => {
    const created = await createList.mutateAsync(undefined);
    onSelectList(created.id);
    setPickerOpen(false);
  };

  return (
    <>
      <View className="gap-2">
        <Pressable
          accessibilityRole="button"
          onPress={() => setPickerOpen(true)}
          className="flex-row items-center justify-between rounded-button border border-border px-3 py-2.5 dark:border-border-dark">
          <View className="min-w-0 flex-1">
            <Text variant="caption">Shopping list</Text>
            <Text className="font-semibold" numberOfLines={1}>
              {selectedList?.name ?? 'No list selected'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={palette.textSecondary} />
        </Pressable>

        <View className="flex-row flex-wrap gap-2">
          <Button label="Rename" variant="ghost" onPress={openRename} disabled={!selectedList} className="flex-1" />
          <Button
            label="Shopping done"
            variant="secondary"
            onPress={handleArchive}
            disabled={!selectedList}
            className="flex-1"
          />
          <Button
            label="Delete list"
            variant="ghost"
            onPress={() => selectedList && confirmDeleteList(selectedList)}
            disabled={!selectedList}
            className="flex-1"
          />
        </View>
      </View>

      <BottomSheet visible={pickerOpen} onClose={() => setPickerOpen(false)} title="Shopping lists">
        <ScrollView className="max-h-80" showsVerticalScrollIndicator={false}>
          <Text variant="label" className="mb-2">
            Active
          </Text>
          {activeLists.length === 0 ? (
            <Text variant="bodySecondary" className="mb-3">
              No active lists yet.
            </Text>
          ) : (
            activeLists.map((list) => (
              <ListPickerRow
                key={list.id}
                list={list}
                selected={list.id === selectedList?.id}
                onPress={() => {
                  onSelectList(list.id);
                  setPickerOpen(false);
                }}
                onDelete={() => confirmDeleteList(list)}
              />
            ))
          )}

          <Button label="New list" variant="ghost" onPress={() => void handleNewList()} className="mb-4 mt-2" />

          {archivedLists.length > 0 ? (
            <>
              <Text variant="label" className="mb-2">
                Past lists
              </Text>
              {archivedLists.map((list) => (
                <ListPickerRow
                  key={list.id}
                  list={list}
                  archived
                  onDelete={() => confirmDeleteList(list)}
                />
              ))}
            </>
          ) : null}
        </ScrollView>
      </BottomSheet>

      <BottomSheet visible={renameOpen} onClose={() => setRenameOpen(false)} title="Rename list">
        <Input value={renameValue} onChangeText={setRenameValue} placeholder="List name" className="mb-3" />
        <Button label="Save" onPress={() => void handleRename()} disabled={!renameValue.trim()} />
      </BottomSheet>
    </>
  );
}

function ListPickerRow({
  list,
  selected = false,
  archived = false,
  onPress,
  onDelete,
}: {
  list: ShoppingListSession;
  selected?: boolean;
  archived?: boolean;
  onPress?: () => void;
  onDelete?: () => void;
}) {
  const { palette } = useTheme();

  return (
    <View
      className={cn(
        'mb-1 flex-row items-center rounded-button border',
        selected ? 'border-brand bg-brand/10 dark:border-brand-dark' : 'border-border dark:border-border-dark',
        archived && 'opacity-80',
      )}>
      <Pressable
        accessibilityRole="button"
        disabled={archived && !onPress}
        onPress={onPress}
        className="min-w-0 flex-1 px-3 py-2.5">
        <Text className="font-medium">{list.name}</Text>
        <Text variant="caption">
          {archived ? 'Archived' : 'Active'}
          {list.meal_plan_week_start ? ` · Week of ${list.meal_plan_week_start}` : ''}
        </Text>
      </Pressable>
      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${list.name}`}
          onPress={onDelete}
          className="h-10 w-10 items-center justify-center">
          <Ionicons name="trash-outline" size={18} color={palette.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}
