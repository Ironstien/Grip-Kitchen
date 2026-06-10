import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useUserCategories, useUserCategoryMutations } from '@/hooks/useUserCategories';
import { formatErrorMessage } from '@/lib/errors';

export function CategoriesManager() {
  const { data: categories = [], isLoading } = useUserCategories();
  const { create, rename, remove } = useUserCategoryMutations();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) {
      return;
    }

    try {
      await create.mutateAsync(newName.trim());
      setNewName('');
    } catch (error) {
      Alert.alert('Could not add category', formatErrorMessage(error, 'Create failed.'));
    }
  };

  const handleRename = async (id: string) => {
    if (!editingName.trim()) {
      return;
    }

    try {
      await rename.mutateAsync({ id, name: editingName.trim() });
      setEditingId(null);
      setEditingName('');
    } catch (error) {
      Alert.alert('Could not rename category', formatErrorMessage(error, 'Rename failed.'));
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
            void remove.mutateAsync(id).catch((error: unknown) => {
              Alert.alert('Could not delete category', formatErrorMessage(error, 'Delete failed.'));
            });
          },
        },
      ],
    );
  };

  if (isLoading) {
    return <Text variant="bodySecondary">Loading categories...</Text>;
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

      <View className="flex-row gap-3">
        <Input
          value={newName}
          onChangeText={setNewName}
          placeholder="New category name"
          className="flex-1"
        />
        <Button label="Add" onPress={() => void handleCreate()} />
      </View>
    </View>
  );
}
