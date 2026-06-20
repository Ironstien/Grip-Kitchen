import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';

import { IngredientConversionsEditor } from '@/components/settings/IngredientConversionsEditor';
import { CategorySelect } from '@/components/ui/CategorySelect';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Form';
import { Text } from '@/components/ui/Text';
import { UnitSelect } from '@/components/ui/UnitSelect';
import { useIngredientMutations } from '@/hooks/useIngredients';
import { useUserCategories } from '@/hooks/useUserCategories';
import { useUserUnits } from '@/hooks/useUserUnits';
import { isMasterCategoryName, resolveMasterCategoryName } from '@/lib/categories';
import { cn } from '@/lib/cn';
import { formatErrorMessage } from '@/lib/errors';
import { formatPurchaseSummary } from '@/lib/ingredients';
import { isMasterUnitSymbol, resolveMasterUnitSymbol } from '@/lib/units';
import type { IngredientWithConversions } from '@/types/database';

type SortKey =
  | 'name'
  | 'display_name'
  | 'category'
  | 'purchase_price'
  | 'purchase_qty'
  | 'purchase_unit'
  | 'stock_unit';

type MasterIngredientsDesktopSpreadsheetProps = {
  ingredients: IngredientWithConversions[];
};

type NewRowDraft = {
  name: string;
  display_name: string;
  category: string;
  purchase_price: string;
  purchase_qty: string;
  purchase_unit: string;
  stock_unit: string;
};

const PICKER_KEYS = new Set<SortKey>(['category', 'purchase_unit', 'stock_unit']);

const columns: Array<{ key: SortKey; label: string; width: number }> = [
  { key: 'name', label: 'Name', width: 220 },
  { key: 'display_name', label: 'Display Name', width: 160 },
  { key: 'category', label: 'Category', width: 140 },
  { key: 'purchase_price', label: 'Price (AUD)', width: 100 },
  { key: 'purchase_qty', label: 'QTY', width: 72 },
  { key: 'purchase_unit', label: 'Unit', width: 100 },
  { key: 'stock_unit', label: 'Stock Unit', width: 100 },
];

function getDefaultUnit(masterUnits: Array<{ symbol: string }> = []): string {
  return (
    masterUnits.find((unit) => unit.symbol === 'pack')?.symbol ??
    masterUnits.find((unit) => unit.symbol === 'each')?.symbol ??
    masterUnits[0]?.symbol ??
    ''
  );
}

function getDefaultCategory(masterCategories: Array<{ name: string }> = []): string {
  return (
    masterCategories.find((category) => category.name === 'Pantry')?.name ??
    masterCategories[0]?.name ??
    ''
  );
}

function createDefaultNewRow(
  masterUnits: Array<{ symbol: string }>,
  masterCategories: Array<{ name: string }>,
): NewRowDraft {
  const defaultUnit = getDefaultUnit(masterUnits);

  return {
    name: '',
    display_name: '',
    category: getDefaultCategory(masterCategories),
    purchase_price: '0',
    purchase_qty: '1',
    purchase_unit: defaultUnit,
    stock_unit: defaultUnit,
  };
}

export function MasterIngredientsDesktopSpreadsheet({
  ingredients,
}: MasterIngredientsDesktopSpreadsheetProps) {
  const { data: masterUnits = [] } = useUserUnits();
  const { data: masterCategories = [] } = useUserCategories();
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ id: string; key: SortKey } | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [newRow, setNewRow] = useState<NewRowDraft>(() => createDefaultNewRow([], []));
  const [newRowError, setNewRowError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [conversionsIngredient, setConversionsIngredient] = useState<IngredientWithConversions | null>(
    null,
  );
  const [deleteConfirm, setDeleteConfirm] = useState<{
    ids: string[];
    title: string;
    message: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { create, update, remove } = useIngredientMutations();

  useEffect(() => {
    if (masterUnits.length === 0 || masterCategories.length === 0) {
      return;
    }

    setNewRow((current) => {
      if (current.name) {
        return current;
      }

      const defaults = createDefaultNewRow(masterUnits, masterCategories);
      return {
        ...defaults,
        category: isMasterCategoryName(current.category, masterCategories)
          ? current.category
          : defaults.category,
        purchase_unit: isMasterUnitSymbol(current.purchase_unit, masterUnits)
          ? current.purchase_unit
          : defaults.purchase_unit,
        stock_unit: isMasterUnitSymbol(current.stock_unit, masterUnits)
          ? current.stock_unit
          : defaults.stock_unit,
      };
    });
  }, [masterCategories, masterUnits]);

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

  const tableWidth = columns.reduce((sum, column) => sum + column.width, 0) + 40 + 140;

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

    if (key === 'purchase_price') {
      const parsed = Number(value);
      if (Number.isNaN(parsed) || parsed < 0) {
        return 'Enter a valid price.';
      }
      return null;
    }

    if (key === 'purchase_qty') {
      const parsed = Number(value);
      if (Number.isNaN(parsed) || parsed <= 0) {
        return 'Enter a quantity greater than zero.';
      }
      return null;
    }

    if (key === 'purchase_unit' || key === 'stock_unit') {
      if (!isMasterUnitSymbol(value, masterUnits)) {
        return 'Choose a unit from the Master Units List.';
      }
      return null;
    }

    if (key === 'category') {
      if (!isMasterCategoryName(value, masterCategories)) {
        return 'Choose a category from the Master Category List.';
      }
      return null;
    }

    return null;
  };

  const startEditing = (ingredient: IngredientWithConversions, key: SortKey) => {
    if (PICKER_KEYS.has(key)) {
      return;
    }

    const value =
      key === 'purchase_price' || key === 'purchase_qty'
        ? String(ingredient[key])
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
      editingCell.key === 'purchase_price' || editingCell.key === 'purchase_qty'
        ? String(ingredient[editingCell.key])
        : String(ingredient[editingCell.key] ?? '');

    if (trimmed === currentValue.trim()) {
      setEditingCell(null);
      return;
    }

    try {
      const input: Record<string, string | number> =
        editingCell.key === 'purchase_price' || editingCell.key === 'purchase_qty'
          ? { [editingCell.key]: Number(trimmed) }
          : editingCell.key === 'name' || editingCell.key === 'display_name'
            ? { [editingCell.key]: trimmed }
            : { [editingCell.key]: trimmed };

      await update.mutateAsync({ id: ingredient.id, input });
    } catch (error) {
      Alert.alert('Update failed', formatErrorMessage(error, 'Update failed.'));
    } finally {
      setEditingCell(null);
    }
  };

  const handleCategoryChange = async (ingredient: IngredientWithConversions, category: string) => {
    if (ingredient.category === category) {
      return;
    }

    try {
      await update.mutateAsync({ id: ingredient.id, input: { category } });
    } catch (error) {
      Alert.alert('Update failed', formatErrorMessage(error, 'Update failed.'));
    }
  };

  const handleUnitChange = async (
    ingredient: IngredientWithConversions,
    key: 'purchase_unit' | 'stock_unit',
    symbol: string,
  ) => {
    if (ingredient[key] === symbol) {
      return;
    }

    try {
      await update.mutateAsync({ id: ingredient.id, input: { [key]: symbol } });
    } catch (error) {
      Alert.alert('Update failed', formatErrorMessage(error, 'Update failed.'));
    }
  };

  const commitNewRow = async () => {
    const name = newRow.name.trim();
    if (!name || isCreating) {
      return;
    }

    const categoryName = resolveMasterCategoryName(newRow.category, masterCategories);
    const purchaseUnit = resolveMasterUnitSymbol(newRow.purchase_unit, masterUnits);
    const stockUnit = resolveMasterUnitSymbol(newRow.stock_unit, masterUnits);

    const validationErrors = [
      validateField('name', name),
      validateField('category', newRow.category),
      validateField('purchase_price', newRow.purchase_price),
      validateField('purchase_qty', newRow.purchase_qty),
      validateField('purchase_unit', newRow.purchase_unit),
      validateField('stock_unit', newRow.stock_unit),
    ].filter(Boolean);

    if (validationErrors.length > 0 || !categoryName || !purchaseUnit || !stockUnit) {
      const message =
        validationErrors[0] ?? 'Choose category and units from the Master lists in Settings.';
      setNewRowError(message);
      Alert.alert('Cannot add row', message);
      return;
    }

    try {
      setIsCreating(true);
      setNewRowError(null);
      await create.mutateAsync({
        name,
        display_name: newRow.display_name.trim(),
        category: categoryName,
        purchase_price: Number(newRow.purchase_price),
        purchase_qty: Number(newRow.purchase_qty),
        purchase_unit: purchaseUnit,
        stock_unit: stockUnit,
      });
      setNewRow(createDefaultNewRow(masterUnits, masterCategories));
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
    setNewRow((current) => {
      const next = { ...current, [key]: value };
      if (key === 'purchase_unit' && current.stock_unit === current.purchase_unit) {
        next.stock_unit = value;
      }
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) {
      return;
    }

    setDeleteConfirm({
      ids: Array.from(selectedIds),
      title: 'Delete ingredients',
      message: `Delete ${selectedIds.size} selected ingredient(s)? This cannot be undone.`,
    });
  };

  const handleDeleteRow = (ingredient: IngredientWithConversions) => {
    setDeleteConfirm({
      ids: [ingredient.id],
      title: 'Delete ingredient',
      message: `Delete ${ingredient.name}? This removes it from the pantry and cannot be undone if used in recipes.`,
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) {
      return;
    }

    try {
      setIsDeleting(true);
      await Promise.all(deleteConfirm.ids.map((id) => remove.mutateAsync(id)));

      if (deleteConfirm.ids.length > 1) {
        setSelectedIds(new Set());
      }

      setDeleteConfirm(null);
    } catch (error) {
      Alert.alert('Delete failed', formatErrorMessage(error, 'Delete failed.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const renderTextCell = (
    ingredient: IngredientWithConversions,
    column: (typeof columns)[number],
    rawValue: string,
  ) => {
    const isEditing = editingCell?.id === ingredient.id && editingCell.key === column.key;

    return (
      <Pressable
        key={column.key}
        style={{ width: column.width }}
        onPress={() => startEditing(ingredient, column.key)}
        className="px-2">
        {isEditing ? (
          <TextInput
            autoFocus
            value={draftValue}
            onChangeText={setDraftValue}
            onBlur={() => void commitEdit()}
            onSubmitEditing={() => void commitEdit()}
            keyboardType={
              column.key === 'purchase_price' || column.key === 'purchase_qty' ? 'decimal-pad' : 'default'
            }
            className="rounded border border-brand px-2 py-1 text-sm text-text dark:text-text-dark"
          />
        ) : (
          <Text className="text-sm" numberOfLines={2}>
            {rawValue || '—'}
          </Text>
        )}
      </Pressable>
    );
  };

  const renderCategoryCell = (ingredient: IngredientWithConversions, width: number) => (
    <View key="category" style={{ width }} className="px-2">
      <CategorySelect
        compact
        value={ingredient.category}
        categories={masterCategories}
        onChange={(category) => void handleCategoryChange(ingredient, category)}
      />
    </View>
  );

  const renderUnitCell = (
    ingredient: IngredientWithConversions,
    key: 'purchase_unit' | 'stock_unit',
    width: number,
  ) => (
    <View key={key} style={{ width }} className="px-2">
      <UnitSelect
        compact
        value={ingredient[key]}
        units={masterUnits}
        onChange={(symbol) => void handleUnitChange(ingredient, key, symbol)}
      />
    </View>
  );

  const renderNewRowTextCell = (
    key: keyof NewRowDraft,
    width: number,
    placeholder: string,
    keyboardType: 'default' | 'decimal-pad' = 'default',
  ) => (
    <View key={key} style={{ width }} className="px-2">
      <TextInput
        value={newRow[key]}
        onChangeText={(value) => updateNewRowField(key, value)}
        onSubmitEditing={() => void commitNewRow()}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType}
        className="rounded border border-dashed border-border px-2 py-1 text-sm text-text dark:border-border-dark dark:text-text-dark"
      />
    </View>
  );

  if (masterUnits.length === 0 || masterCategories.length === 0) {
    return (
      <Text variant="bodySecondary">
        Add categories and units in Settings → Master Category List and Master Units List before
        adding ingredients.
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

      <ScrollView horizontal showsHorizontalScrollIndicator className="w-full">
        <View style={{ minWidth: tableWidth }}>
          <View className="flex-row border-b border-border bg-surface-secondary px-2 py-1.5 dark:border-border-dark dark:bg-surface-dark-secondary">
            <View className="w-10" />
            {columns.map((column) => (
              <Pressable
                key={column.key}
                style={{ width: column.width }}
                onPress={() => toggleSort(column.key)}
                className="px-2">
                <Text variant="label">
                  {column.label}
                  {sortKey === column.key ? (sortAsc ? ' ↑' : ' ↓') : ''}
                </Text>
              </Pressable>
            ))}
            <View style={{ width: 140 }} className="px-2">
              <Text variant="label">Actions</Text>
            </View>
          </View>

          {sortedIngredients.map((ingredient) => (
            <View
              key={ingredient.id}
              className="flex-row items-center border-b border-border px-2 py-1.5 dark:border-border-dark">
              <Pressable onPress={() => toggleSelected(ingredient.id)} className="w-10 items-center">
                <View
                  className={cn(
                    'h-4 w-4 rounded border border-border dark:border-border-dark',
                    selectedIds.has(ingredient.id) && 'bg-brand dark:bg-brand-dark',
                  )}
                />
              </Pressable>

              {columns.map((column) => {
                if (column.key === 'category') {
                  return renderCategoryCell(ingredient, column.width);
                }

                if (column.key === 'purchase_unit' || column.key === 'stock_unit') {
                  return renderUnitCell(ingredient, column.key, column.width);
                }

                const rawValue =
                  column.key === 'purchase_price' || column.key === 'purchase_qty'
                    ? String(ingredient[column.key])
                    : String(ingredient[column.key] ?? '');

                return renderTextCell(ingredient, column, rawValue);
              })}

              <View style={{ width: 140 }} className="flex-row items-center gap-2 px-2">
                <Pressable onPress={() => setConversionsIngredient(ingredient)}>
                  <Text className="text-sm text-brand dark:text-brand-dark">Convert</Text>
                </Pressable>
                <Pressable onPress={() => handleDeleteRow(ingredient)}>
                  <Text className="text-sm text-status-danger">Delete</Text>
                </Pressable>
              </View>
            </View>
          ))}

          <View className="flex-row items-center border-b border-border bg-brand/5 px-2 py-1.5 dark:border-border-dark dark:bg-brand-dark/10">
            <View className="w-10 items-center">
              <Text variant="caption">+</Text>
            </View>
            {renderNewRowTextCell('name', columns[0].width, 'Store name...')}
            {renderNewRowTextCell('display_name', columns[1].width, 'Display name...')}
            <View style={{ width: columns[2].width }} className="px-2">
              <CategorySelect
                compact
                value={newRow.category}
                categories={masterCategories}
                onChange={(category) => updateNewRowField('category', category)}
              />
            </View>
            {renderNewRowTextCell('purchase_price', columns[3].width, '0', 'decimal-pad')}
            {renderNewRowTextCell('purchase_qty', columns[4].width, '1', 'decimal-pad')}
            <View style={{ width: columns[5].width }} className="px-2">
              <UnitSelect
                compact
                value={newRow.purchase_unit}
                units={masterUnits}
                onChange={(symbol) => updateNewRowField('purchase_unit', symbol)}
              />
            </View>
            <View style={{ width: columns[6].width }} className="px-2">
              <UnitSelect
                compact
                value={newRow.stock_unit}
                units={masterUnits}
                onChange={(symbol) => updateNewRowField('stock_unit', symbol)}
              />
            </View>
            <View style={{ width: 140 }} className="px-2">
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
      </ScrollView>

      {newRowError ? <Text className="text-sm text-status-danger">{newRowError}</Text> : null}

      <Text variant="caption">
        Enter how you buy each item: total price, quantity, and unit. Stock unit is how the pantry
        counts it (e.g. pack, bottle). Use Convert to add rules like 1 pack = 12 slices. Display name
        is shown in recipes.
      </Text>

      {sortedIngredients.length > 0 ? (
        <Text variant="caption">
          Example: {formatPurchaseSummary(sortedIngredients[0])}
        </Text>
      ) : null}

      <Modal
        visible={conversionsIngredient !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setConversionsIngredient(null)}>
        <View className="flex-1 items-center justify-center bg-black/40 p-4">
          <Pressable className="absolute inset-0" onPress={() => setConversionsIngredient(null)} />
          <View className="max-h-[80%] w-full max-w-2xl rounded-card border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
            <Text className="mb-1 text-lg font-semibold">Unit conversions</Text>
            {conversionsIngredient ? (
              <>
                <Text variant="bodySecondary" className="mb-4">
                  {conversionsIngredient.name}
                </Text>
                <ScrollView className="max-h-[420px]" keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                  <IngredientConversionsEditor
                    ingredient={conversionsIngredient}
                    onClose={() => setConversionsIngredient(null)}
                  />
                </ScrollView>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={deleteConfirm !== null}
        title={deleteConfirm?.title ?? 'Delete ingredient'}
        message={deleteConfirm?.message ?? ''}
        confirmLabel={isDeleting ? 'Deleting…' : 'Delete'}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteConfirm(null);
          }
        }}
      />
    </View>
  );
}
