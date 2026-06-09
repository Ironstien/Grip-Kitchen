import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useStorageLocationMutations, useStorageLocations } from '@/hooks/useStorageLocations';

export function StorageLocationsManager() {
  const { data: locations = [], isLoading } = useStorageLocations();
  const { create, rename, remove } = useStorageLocationMutations();
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
      const message = error instanceof Error ? error.message : 'Create failed.';
      Alert.alert('Could not add location', message);
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
      const message = error instanceof Error ? error.message : 'Rename failed.';
      Alert.alert('Could not rename location', message);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete location', `Delete ${name}? Items in this location will become unassigned.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void remove.mutateAsync(id);
        },
      },
    ]);
  };

  if (isLoading) {
    return <Text variant="bodySecondary">Loading locations...</Text>;
  }

  return (
    <View className="gap-4">
      <Text variant="label">Storage locations</Text>
      <Text variant="bodySecondary">
        Manage where pantry items live. Default locations are created automatically on first use.
      </Text>

      {locations.map((location, index) => (
        <View
          key={location.id}
          className="flex-row items-center gap-3 rounded-card border border-border px-3 py-3 dark:border-border-dark">
          <Text variant="caption" className="w-6">
            {index + 1}
          </Text>
          {editingId === location.id ? (
            <>
              <Input
                value={editingName}
                onChangeText={setEditingName}
                className="flex-1"
                autoFocus
              />
              <Button label="Save" onPress={() => void handleRename(location.id)} />
            </>
          ) : (
            <>
              <Text className="flex-1 font-medium">{location.name}</Text>
              <Pressable onPress={() => {
                setEditingId(location.id);
                setEditingName(location.name);
              }}>
                <Text className="text-brand dark:text-brand-dark">Rename</Text>
              </Pressable>
              <Pressable onPress={() => handleDelete(location.id, location.name)}>
                <Text className="text-status-danger">Delete</Text>
              </Pressable>
            </>
          )}
        </View>
      ))}

      <View className="flex-row gap-3">
        <Input
          value={newName}
          onChangeText={setNewName}
          placeholder="New location name"
          className="flex-1"
        />
        <Button label="Add" onPress={() => void handleCreate()} />
      </View>
    </View>
  );
}
