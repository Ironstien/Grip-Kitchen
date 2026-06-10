import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { UnitSelect } from '@/components/ui/UnitSelect';
import { INVENTORY_CATEGORIES } from '@/constants/inventory';
import { useIngredientMutations } from '@/hooks/useIngredients';
import { useUserUnits } from '@/hooks/useUserUnits';
import { cn } from '@/lib/cn';
import { formatErrorMessage } from '@/lib/errors';
import { isMasterUnitSymbol, resolveMasterUnitSymbol } from '@/lib/units';
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

const UNIT_KEYS = new Set<SortKey>(['unit_of_measure', 'price_unit_of_measure']);

const columns: Array<{ key: SortKey; label: string; flex: number }> = [
  { key: 'name', label: 'Name', flex: 2.2 },
  { key: 'category', label: 'Category', flex: 1.4 },
  { key: 'unit_of_measure', label: 'Unit', flex: 1 },
  { key: 'price_per_unit', label: 'Price (AUD)', flex: 1 },
  { key: 'price_unit_of_measure', label: 'Per', flex: 1 },
];

function getDefaultUnit(masterUnits: Array<{ symbol: string }>): string {
  return (
    masterUnits.find((unit) => unit.symbol === 'each')?.symbol ??
    masterUnits[0]?.symbol ??
    ''
  );
}

function createDefaultNewRow(masterUnits: Array<{ symbol: string }>): NewRowDraft {
  const defaultUnit = getDefaultUnit(masterUnits);

  return {
    name: '',
    category: INVENTORY_CATEGORIES[0],
    unit_of_measure: defaultUnit,
    price_per_unit: '0',
    price_unit_of_measure: defaultUnit,
  };
}

export function MasterIngredientsDesktopSpreadsheet({
  ingredients,
}: MasterIngredientsDesktopSpreadsheetProps) {
  const { data: masterUnits = [] } = useUserUnits();
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ id: string; key: SortKey } | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [newRow, setNewRow] = useState<NewRowDraft>(() => createDefaultNewRow([]));
  const [newRowError, setNewRowError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { create, update, remove } = useIngredientMutations();

  useEffect(() => {
    if (masterUnits.length === 0) {
      return;
    }

    setNewRow((current) => {
      if (current.name) {
        return current;
      }

      const defaults = createDefaultNewRow(masterUnits);
      return {
        ...defaults,
        unit_of_measure: isMasterUnitSymbol(current.unit_of_measure, masterUnits)
          ? current.unit_of_measure
          : defaults.unit_of_measure,
        price_unit_of_measure: isMasterUnitSymbol(current.price_unit_of_measure, masterUnits)
          ? current.price_unit_of_measure
          : defaults.price_unit_of_measure,
      };
    });
  }, [masterUnits]);

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
      if (!isMasterUnitSymbol(value, masterUnits)) {
        return 'Choose a unit from the Master Units List.';
      }
      return null;
    }

    if (key === 'category' && !value.trim()) {
      return 'Category is required.';
    }

    return null;
  };

  const startEditing = (ingredient: Ingredient, key: SortKey) => {
    if (UNIT_KEYS.has(key)) {
      return;
    }

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
      const input: Record<string, string | number> =
        editingCell.key === 'price_per_unit'
          ? { price_per_unit: Number(trimmed) }
          : editingCell.key === 'name'
            ? { name: trimmed }
            : { [editingCell.key]: trimmed };

      await update.mutateAsync({ id: ingredient.id, input });
    } catch (error) {
      const message = formatErrorMessage(error, 'Update failed.');
      Alert.alert('Update failed', message);
    } finally {
      setEditingCell(null);
    }
  };

  const handleUnitChange = async (
    ingredient: Ingredient,
    key: 'unit_of_measure' | 'price_unit_of_measure',
    symbol: string,
  ) => {
    if (ingredient[key] === symbol) {
      return;
    }

    try {
      await update.mutateAsync({ id: ingredient.id, input: { [key]: symbol } });
    } catch (error) {
      const message = formatErrorMessage(error, 'Update failed.');
      Alert.alert('Update failed', message);
    }
  };

  const commitNewRow = async () => {
    const name = newRow.name.trim();
    if (!name || isCreating) {
      return;
    }

    const unitSymbol = resolveMasterUnitSymbol(newRow.unit_of_measure, masterUnits);
    const priceUnitSymbol = resolveMasterUnitSymbol(newRow.price_unit_of_measure, masterUnits);

    const validationErrors = [
      validateField('name', name),
      validateField('category', newRow.category),
      validateField('unit_of_measure', newRow.unit_of_measure),
      validateField('price_per_unit', newRow.price_per_unit),
      validateField('price_unit_of_measure', newRow.price_unit_of_measure),
    ].filter(Boolean);

    if (validationErrors.length > 0 || !unitSymbol || !priceUnitSymbol) {
      const message =
        validationErrors[0] ?? 'Choose units from the Master Units List in Settings.';
      setNewRowError(message);
      Alert.alert('Cannot add row', message);
      return;
    }

    try {
      setIsCreating(true);
      setNewRowError(null);
      await create.mutateAsync({
        name,
        category: newRow.category.trim(),
        unit_of_measure: unitSymbol,
        price_per_unit: Number(newRow.price_per_unit),
        price_unit_of_measure: priceUnitSymbol,
      });
      setNewRow(createDefaultNewRow(masterUnits));
    } catch (error) {
      const message = formatErrorMessage(error, 'Could not create ingredient.');
      setNewRowError(message);
      Alert.alert('Create failed', message);
    } finally {
      setIsCreating(false);
    }
  };

  const updateNewRowField = (key: keyof NewRowDraft, value: string) => {
    setNewRowError(null);
    setNewRow((current) => ({ ...current, [key]: value }));
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

  const renderTextCell = (
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

  const renderUnitCell = (
    ingredient: Ingredient,
    key: 'unit_of_measure' | 'price_unit_of_measure',
    flex: number,
  ) => (
    <View key={key} style={{ flex }} className="px-2">
      <UnitSelect
        compact
        value={ingredient[key]}
        units={masterUnits}
        onChange={(symbol) => void handleUnitChange(ingredient, key, symbol)}
      />
    </View>
  );

  const renderNewRowTextCell = (key: keyof NewRowDraft, flex: number, placeholder: string) => (
    <View key={key} style={{ flex }} className="px-2">
      <TextInput
        value={newRow[key]}
        onChangeText={(value) => updateNewRowField(key, value)}
        onSubmitEditing={() => void commitNewRow()}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={key === 'price_per_unit' ? 'decimal-pad' : 'default'}
        className="rounded border border-dashed border-border px-2 py-1 text-sm text-text dark:border-border-dark dark:text-text-dark"
      />
    </View>
  );

  const renderNewRowUnitCell = (key: 'unit_of_measure' | 'price_unit_of_measure', flex: number) => (
    <View key={key} style={{ flex }} className="px-2">
      <UnitSelect
        compact
        value={newRow[key]}
        units={masterUnits}
        onChange={(symbol) => updateNewRowField(key, symbol)}
      />
    </View>
  );

  if (masterUnits.length === 0) {
    return (
      <Text variant="bodySecondary">
        Add units in Settings → Master Units List before adding ingredients.
      </Text>
    );
  }

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
              if (column.key === 'unit_of_measure' || column.key === 'price_unit_of_measure') {
                return renderUnitCell(ingredient, column.key, column.flex);
              }

              const rawValue =
                column.key === 'price_per_unit'
                  ? String(ingredient.price_per_unit)
                  : String(ingredient[column.key] ?? '');

              return renderTextCell(ingredient, column, rawValue);
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
          {renderNewRowTextCell('name', columns[0].flex, 'New ingredient...')}
          {renderNewRowTextCell('category', columns[1].flex, 'Category')}
          {renderNewRowUnitCell('unit_of_measure', columns[2].flex)}
          {renderNewRowTextCell('price_per_unit', columns[3].flex, '0')}
          {renderNewRowUnitCell('price_unit_of_measure', columns[4].flex)}
          <View className="w-20 px-1">
            <Button
              label={isCreating ? 'Adding...' : 'Add'}
              variant="secondary"
              disabled={!newRow.name.trim() || isCreating}
              onPress={() => void commitNewRow()}
              className="min-h-[36px] px-2 py-1"
              textClassName="text-sm"
            />
          </View>
        </View>
      </View>

      {newRowError ? (
        <Text className="text-sm text-status-danger">{newRowError}</Text>
      ) : null}

      <Text variant="caption">
        Click any cell to edit. Unit columns use the Master Units List. Add a new ingredient in the
        bottom row.
      </Text>
    </View>
  );
}
