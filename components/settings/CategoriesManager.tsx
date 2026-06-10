import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useUserCategories, useUserCategoryMutations } from '@/hooks/useUserCategories';
import { formatErrorMessage } from '@/lib/errors';

export function CategoriesManager() {
  const { data: categories = [], isLoading, isError, error } = useUserCategories();
  const { create, rename, remove } = useUserCategoryMutations();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed || isCreating) {
      return;
    }

    try {
      setIsCreating(true);
      setActionError(null);
      await create.mutateAsync(trimmed);
      setNewName('');
    } catch (err) {
      const message = formatErrorMessage(err, 'Could not add category.');
      setActionError(message);
      Alert.alert('Could not add category', message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRename = async (id: string) => {
    if (!editingName.trim()) {
      return;
    }

    try {
      setActionError(null);
      await rename.mutateAsync({ id, name: editingName.trim() });
      setEditingId(null);
      setEditingName('');
    } catch (err) {
      const message = formatErrorMessage(err, 'Rename failed.');
      setActionError(message);
      Alert.alert('Could not rename category', message);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete category',
      `Delete ${name}? Existing ingredients keep this category text until you edit them.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void remove.mutateAsync(id).catch((err: unknown) => {
              const message = formatErrorMessage(err, 'Delete failed.');
              setActionError(message);
              Alert.alert('Could not delete category', message);
            });
          },
        },
      ],
    );
  };

  if (isLoading) {
    return <Text variant="bodySecondary">Loading categories...</Text>;
  }

  if (isError) {
    return (
      <Text className="text-status-danger">
        {formatErrorMessage(error, 'Could not load categories.')}
      </Text>
    );
  }

  return (
    <View className="gap-4">
      <Text variant="label">Master Category List</Text>
      <Text variant="bodySecondary">
        All category fields across the app use this list. Default grocery categories are provided;
        add your own as needed.
      </Text>

      {categories.map((category, index) => (
        <View
          key={category.id}
          className="flex-row items-center gap-3 rounded-card border border-border px-3 py-3 dark:border-border-dark">
          <Text variant="caption" className="w-6">
            {index + 1}
          </Text>
          {editingId === category.id ? (
            <>
              <Input
                value={editingName}
                onChangeText={setEditingName}
                className="flex-1"
                autoFocus
              />
              <Button label="Save" onPress={() => void handleRename(category.id)} />
            </>
          ) : (
            <>
              <Text className="flex-1 font-medium">{category.name}</Text>
              <Pressable
                onPress={() => {
                  setEditingId(category.id);
                  setEditingName(category.name);
                }}>
                <Text className="text-brand dark:text-brand-dark">Rename</Text>
              </Pressable>
              {!category.is_system && (
                <Pressable onPress={() => handleDelete(category.id, category.name)}>
                  <Text className="text-status-danger">Delete</Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      ))}

      <View className="flex-row items-center gap-3">
        <Input
          value={newName}
          onChangeText={(value) => {
            setActionError(null);
            setNewName(value);
          }}
          placeholder="New category name"
          className="flex-1"
          onSubmitEditing={() => void handleCreate()}
        />
        <Button
          label={isCreating ? 'Adding...' : 'Add'}
          onPress={() => void handleCreate()}
          disabled={!newName.trim() || isCreating}
        />
      </View>

      {actionError ? <Text className="text-sm text-status-danger">{actionError}</Text> : null}
    </View>
  );
}
