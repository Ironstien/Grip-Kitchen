import { useMemo, useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { INVENTORY_CATEGORIES } from '@/constants/inventory';
import { useIngredientMutations } from '@/hooks/useIngredients';
import { cn } from '@/lib/cn';
import { isKnownUnit } from '@/lib/units';
import type { Ingredient } from '@/types/database';

type SortKey =
  | 'name'
  | 'category'
  | 'unit_of_measure'
  | 'price_per_unit'
  | 'price_unit_of_measure';

type MasterIngredientsDesktopSpreadsheetProps = {
  ingredients: Ingredient[];
};

type NewRowDraft = {
  name: string;
  category: string;
  unit_of_measure: string;
  price_per_unit: string;
  price_unit_of_measure: string;
};

const columns: Array<{ key: SortKey; label: string; flex: number }> = [
  { key: 'name', label: 'Name', flex: 2.2 },
  { key: 'category', label: 'Category', flex: 1.4 },
  { key: 'unit_of_measure', label: 'Unit', flex: 0.8 },
  { key: 'price_per_unit', label: 'Price (AUD)', flex: 1 },
  { key: 'price_unit_of_measure', label: 'Per', flex: 0.8 },
];

const defaultNewRow = (): NewRowDraft => ({
  name: '',
  category: INVENTORY_CATEGORIES[0],
  unit_of_measure: 'each',
  price_per_unit: '0',
  price_unit_of_measure: 'each',
});

export function MasterIngredientsDesktopSpreadsheet({
  ingredients,
}: MasterIngredientsDesktopSpreadsheetProps) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ id: string; key: SortKey } | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [newRow, setNewRow] = useState<NewRowDraft>(defaultNewRow);
  const [isCreating, setIsCreating] = useState(false);
  const { create, update, remove } = useIngredientMutations();

  const sortedIngredients = useMemo(() => {
    const copy = [...ingredients];

    copy.sort((a, b) => {
      const aValue = a[sortKey] ?? '';
      const bValue = b[sortKey] ?? '';

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortAsc ? aValue - bValue : bValue - aValue;
      }

      return sortAsc
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

    return copy;
  }, [ingredients, sortAsc, sortKey]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((value) => !value);
      return;
    }

    setSortKey(key);
    setSortAsc(true);
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const validateField = (key: SortKey, value: string): string | null => {
    if (key === 'name') {
      if (!value.trim()) {
        return 'Name is required.';
      }
      return null;
    }

    if (key === 'price_per_unit') {
      const parsed = Number(value);
      if (Number.isNaN(parsed) || parsed < 0) {
        return 'Enter a valid price.';
      }
      return null;
    }

    if (key === 'unit_of_measure' || key === 'price_unit_of_measure') {
      if (!isKnownUnit(value.trim())) {
        return 'Choose a valid unit.';
      }
      return null;
    }

    if (key === 'category' && !value.trim()) {
      return 'Category is required.';
    }

    return null;
  };

  const startEditing = (ingredient: Ingredient, key: SortKey) => {
    const value =
      key === 'price_per_unit'
        ? String(ingredient.price_per_unit)
        : String(ingredient[key] ?? '');

    setEditingCell({ id: ingredient.id, key });
    setDraftValue(value);
  };

  const commitEdit = async () => {
    if (!editingCell) {
      return;
    }

    const ingredient = ingredients.find((entry) => entry.id === editingCell.id);
    if (!ingredient) {
      setEditingCell(null);
      return;
    }

    const trimmed = draftValue.trim();
    const validationError = validateField(editingCell.key, trimmed);
    if (validationError) {
      Alert.alert('Invalid value', validationError);
      return;
    }

    const currentValue =
      editingCell.key === 'price_per_unit'
        ? String(ingredient.price_per_unit)
        : String(ingredient[editingCell.key] ?? '');

    if (trimmed === currentValue.trim()) {
      setEditingCell(null);
      return;
    }

    try {
      const input =
        editingCell.key === 'price_per_unit'
          ? { price_per_unit: Number(trimmed) }
          : editingCell.key === 'name'
            ? { name: trimmed }
            : { [editingCell.key]: trimmed };

      await update.mutateAsync({ id: ingredient.id, input });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update failed.';
      Alert.alert('Update failed', message);
    } finally {
      setEditingCell(null);
    }
  };

  const commitNewRow = async () => {
    const name = newRow.name.trim();
    if (!name || isCreating) {
      return;
    }

    const validationErrors = [
      validateField('name', name),
      validateField('category', newRow.category),
      validateField('unit_of_measure', newRow.unit_of_measure),
      validateField('price_per_unit', newRow.price_per_unit),
      validateField('price_unit_of_measure', newRow.price_unit_of_measure),
    ].filter(Boolean);

    if (validationErrors.length > 0) {
      Alert.alert('Cannot add row', validationErrors[0] ?? 'Check the new row values.');
      return;
    }

    try {
      setIsCreating(true);
      await create.mutateAsync({
        name,
        category: newRow.category.trim(),
        unit_of_measure: newRow.unit_of_measure.trim(),
        price_per_unit: Number(newRow.price_per_unit),
        price_unit_of_measure: newRow.price_unit_of_measure.trim(),
      });
      setNewRow(defaultNewRow());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Create failed.';
      Alert.alert('Create failed', message);
    } finally {
      setIsCreating(false);
    }
  };

  const updateNewRowField = (key: keyof NewRowDraft, value: string) => {
    setNewRow((current) => ({ ...current, [key]: value }));
  };

  const handleNewRowBlur = () => {
    if (newRow.name.trim()) {
      void commitNewRow();
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) {
      return;
    }

    Alert.alert(
      'Delete ingredients',
      `Delete ${selectedIds.size} selected ingredient(s)? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void Promise.all(Array.from(selectedIds).map((id) => remove.mutateAsync(id))).then(() =>
              setSelectedIds(new Set()),
            );
          },
        },
      ],
    );
  };

  const handleDeleteRow = (ingredient: Ingredient) => {
    Alert.alert(
      'Delete ingredient',
      `Delete ${ingredient.name}? This removes it from the pantry and cannot be undone if used in recipes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void remove.mutateAsync(ingredient.id),
        },
      ],
    );
  };

  const renderCell = (
    ingredient: Ingredient,
    column: (typeof columns)[number],
    rawValue: string,
  ) => {
    const isEditing = editingCell?.id === ingredient.id && editingCell.key === column.key;

    return (
      <Pressable
        key={column.key}
        style={{ flex: column.flex }}
        onPress={() => startEditing(ingredient, column.key)}
        className="px-2">
        {isEditing ? (
          <TextInput
            autoFocus
            value={draftValue}
            onChangeText={setDraftValue}
            onBlur={() => void commitEdit()}
            onSubmitEditing={() => void commitEdit()}
            keyboardType={column.key === 'price_per_unit' ? 'decimal-pad' : 'default'}
            className="rounded border border-brand px-2 py-1 text-sm text-text dark:text-text-dark"
          />
        ) : (
          <Text className="text-sm">{rawValue}</Text>
        )}
      </Pressable>
    );
  };

  const renderNewRowCell = (key: keyof NewRowDraft, flex: number, placeholder: string) => (
    <View key={key} style={{ flex }} className="px-2">
      <TextInput
        value={newRow[key]}
        onChangeText={(value) => updateNewRowField(key, value)}
        onBlur={handleNewRowBlur}
        onSubmitEditing={() => void commitNewRow()}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={key === 'price_per_unit' ? 'decimal-pad' : 'default'}
        className="rounded border border-dashed border-border px-2 py-1 text-sm text-text dark:border-border-dark dark:text-text-dark"
      />
    </View>
  );

  return (
    <View className="w-full gap-3">
      {selectedIds.size > 0 && (
        <View className="flex-row items-center justify-between">
          <Text variant="label">{selectedIds.size} selected</Text>
          <Button label="Delete selected" variant="ghost" onPress={handleBulkDelete} />
        </View>
      )}

      <View className="w-full">
        <View className="w-full flex-row border-b border-border bg-surface-secondary px-2 py-2 dark:border-border-dark dark:bg-surface-dark-secondary">
          <View className="w-10" />
          {columns.map((column) => (
            <Pressable
              key={column.key}
              style={{ flex: column.flex }}
              onPress={() => toggleSort(column.key)}
              className="px-2">
              <Text variant="label">
                {column.label}
                {sortKey === column.key ? (sortAsc ? ' ↑' : ' ↓') : ''}
              </Text>
            </Pressable>
          ))}
          <View className="w-16 px-2">
            <Text variant="label" />
          </View>
        </View>

        {sortedIngredients.map((ingredient) => (
          <View
            key={ingredient.id}
            className="w-full flex-row items-center border-b border-border px-2 py-2 dark:border-border-dark">
            <Pressable onPress={() => toggleSelected(ingredient.id)} className="w-10 items-center">
              <View
                className={cn(
                  'h-4 w-4 rounded border border-border dark:border-border-dark',
                  selectedIds.has(ingredient.id) && 'bg-brand dark:bg-brand-dark',
                )}
              />
            </Pressable>

            {columns.map((column) => {
              const rawValue =
                column.key === 'price_per_unit'
                  ? String(ingredient.price_per_unit)
                  : String(ingredient[column.key] ?? '');

              return renderCell(ingredient, column, rawValue);
            })}

            <View className="w-16 px-2">
              <Pressable onPress={() => handleDeleteRow(ingredient)}>
                <Text className="text-sm text-status-danger">Delete</Text>
              </Pressable>
            </View>
          </View>
        ))}

        <View className="w-full flex-row items-center border-b border-border bg-brand/5 px-2 py-2 dark:border-border-dark dark:bg-brand-dark/10">
          <View className="w-10 items-center">
            <Text variant="caption">+</Text>
          </View>
          {renderNewRowCell('name', columns[0].flex, 'New ingredient...')}
          {renderNewRowCell('category', columns[1].flex, 'Category')}
          {renderNewRowCell('unit_of_measure', columns[2].flex, 'Unit')}
          {renderNewRowCell('price_per_unit', columns[3].flex, '0')}
          {renderNewRowCell('price_unit_of_measure', columns[4].flex, 'each')}
          <View className="w-16 px-2">
            <Pressable onPress={() => void commitNewRow()} disabled={!newRow.name.trim() || isCreating}>
              <Text
                className={cn(
                  'text-sm',
                  newRow.name.trim() ? 'text-brand dark:text-brand-dark' : 'text-text-secondary',
                )}>
                {isCreating ? '...' : 'Add'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Text variant="caption">
        Click any cell to edit. Type in the bottom row and press Enter or click Add to create a new
        ingredient.
      </Text>
    </View>
  );
}
