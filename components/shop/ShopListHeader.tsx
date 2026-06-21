import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { FieldDropdownPanel, useFieldDropdown } from '@/components/ui/FieldDropdown';
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

  const { anchorRef, open: pickerOpen, anchor, openDropdown, close: closePicker } = useFieldDropdown({
    minWidth: 280,
  });
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ShoppingListSession | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ShoppingListSession | null>(null);

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

  const handleConfirmArchive = async () => {
    if (!archiveTarget) {
      return;
    }

    await archiveList.mutateAsync(archiveTarget.id);
    if (archiveTarget.id === selectedListId) {
      selectAfterDelete(archiveTarget.id);
    }
    setArchiveTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    await deleteList.mutateAsync(deleteTarget.id);
    if (deleteTarget.id === selectedListId) {
      selectAfterDelete(deleteTarget.id);
    }
    setDeleteTarget(null);
    closePicker();
  };

  const handleNewList = async () => {
    const created = await createList.mutateAsync(undefined);
    onSelectList(created.id);
    closePicker();
  };

  return (
    <>
      <View className="gap-2">
        <View ref={anchorRef} collapsable={false}>
          <Pressable
            accessibilityRole="button"
            onPress={openDropdown}
            className="flex-row items-center justify-between rounded-button border border-border px-3 py-2.5 dark:border-border-dark">
            <View className="min-w-0 flex-1">
              <Text variant="caption">Shopping list</Text>
              <Text className="font-semibold" numberOfLines={1}>
                {selectedList?.name ?? 'No list selected'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={palette.textSecondary} />
          </Pressable>
        </View>

        <View className="flex-row flex-wrap gap-2">
          <Button label="Rename" variant="ghost" onPress={openRename} disabled={!selectedList} className="flex-1" />
          <Button
            label="Shopping done"
            variant="secondary"
            onPress={() => selectedList && setArchiveTarget(selectedList)}
            disabled={!selectedList}
            className="flex-1"
          />
          <Button
            label="Delete list"
            variant="ghost"
            onPress={() => selectedList && setDeleteTarget(selectedList)}
            disabled={!selectedList}
            className="flex-1"
          />
        </View>
      </View>

      <FieldDropdownPanel
        visible={pickerOpen}
        anchor={anchor}
        onClose={closePicker}
        minWidth={280}
        maxHeight={400}>
        <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled className="max-h-[380px]">
          <Text variant="label" className="border-b border-border bg-surface-secondary px-2 py-1.5 dark:border-border-dark dark:bg-surface-dark-secondary">
            Active
          </Text>
          {activeLists.length === 0 ? (
            <Text variant="bodySecondary" className="px-2 py-2">
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
                  closePicker();
                }}
                onDelete={() => setDeleteTarget(list)}
              />
            ))
          )}

          <View className="border-t border-border px-2 py-2 dark:border-border-dark">
            <Button label="New list" variant="ghost" onPress={() => void handleNewList()} />
          </View>

          {archivedLists.length > 0 ? (
            <>
              <Text variant="label" className="border-b border-border bg-surface-secondary px-2 py-1.5 dark:border-border-dark dark:bg-surface-dark-secondary">
                Past lists
              </Text>
              {archivedLists.map((list) => (
                <ListPickerRow
                  key={list.id}
                  list={list}
                  archived
                  onDelete={() => setDeleteTarget(list)}
                />
              ))}
            </>
          ) : null}
        </ScrollView>
      </FieldDropdownPanel>

      <BottomSheet visible={renameOpen} onClose={() => setRenameOpen(false)} title="Rename list">
        <Input value={renameValue} onChangeText={setRenameValue} placeholder="List name" className="mb-3" />
        <Button label="Save" onPress={() => void handleRename()} disabled={!renameValue.trim()} />
      </BottomSheet>

      <ConfirmSheet
        visible={deleteTarget != null}
        title="Delete shopping list"
        message={
          deleteTarget
            ? `Permanently delete "${deleteTarget.name}" and all its items?`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteList.isPending}
      />

      <ConfirmSheet
        visible={archiveTarget != null}
        title="Confirm shopping done"
        message={
          archiveTarget
            ? `Archive "${archiveTarget.name}"? You can still view it in past lists.`
            : ''
        }
        confirmLabel="Archive"
        onConfirm={() => void handleConfirmArchive()}
        onCancel={() => setArchiveTarget(null)}
        isLoading={archiveList.isPending}
      />
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
        'flex-row items-center border-b border-border dark:border-border-dark',
        selected ? 'bg-brand/10 dark:bg-brand-dark/10' : '',
        archived && 'opacity-80',
      )}>
      <Pressable
        accessibilityRole="button"
        disabled={archived && !onPress}
        onPress={onPress}
        className="min-w-0 flex-1 px-2 py-2">
        <Text className="text-sm font-medium">{list.name}</Text>
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
