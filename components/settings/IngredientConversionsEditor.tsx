import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { UnitSelect } from '@/components/ui/UnitSelect';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useIngredientConversionMutations } from '@/hooks/useIngredientConversions';
import { useUserUnits } from '@/hooks/useUserUnits';
import { cn } from '@/lib/cn';
import {
  getAvailableConversionSuggestions,
  suggestionToDraft,
  type ConversionSuggestion,
} from '@/lib/conversionSuggestions';
import { formatErrorMessage } from '@/lib/errors';
import { fieldPanelClassName } from '@/lib/fieldStyles';
import { isMasterUnitSymbol } from '@/lib/units';
import type { IngredientConversion, IngredientWithConversions } from '@/types/database';

type ConversionDraft = {
  from_unit: string;
  to_unit: string;
  factor: string;
};

type IngredientConversionsEditorProps = {
  ingredient: IngredientWithConversions;
  onClose?: () => void;
};

function toDraft(conversion: IngredientConversion): ConversionDraft {
  return {
    from_unit: conversion.from_unit,
    to_unit: conversion.to_unit,
    factor: String(conversion.factor),
  };
}

function createEmptyDraft(stockUnit: string): ConversionDraft {
  return {
    from_unit: stockUnit,
    to_unit: '',
    factor: '',
  };
}

function isEmptyDraft(draft: ConversionDraft): boolean {
  return !draft.from_unit.trim() && !draft.to_unit.trim() && !draft.factor.trim();
}

export function IngredientConversionsEditor({
  ingredient,
  onClose,
}: IngredientConversionsEditorProps) {
  const { data: masterUnits = [] } = useUserUnits();
  const { replace } = useIngredientConversionMutations();
  const [drafts, setDrafts] = useState<ConversionDraft[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const serverConversionKey = useMemo(
    () => JSON.stringify(ingredient.ingredient_conversions),
    [ingredient.ingredient_conversions],
  );

  useEffect(() => {
    const existing = ingredient.ingredient_conversions.map(toDraft);
    setDrafts(existing.length > 0 ? existing : [createEmptyDraft(ingredient.stock_unit)]);
    setSaveError(null);
  }, [ingredient.id, ingredient.stock_unit, serverConversionKey]);

  const updateDraft = (index: number, patch: Partial<ConversionDraft>) => {
    setSaveError(null);
    setDrafts((current) =>
      current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, ...patch } : entry)),
    );
  };

  const addDraft = () => {
    setSaveError(null);
    setDrafts((current) => [...current, createEmptyDraft(ingredient.stock_unit)]);
  };

  const removeDraft = (index: number) => {
    setSaveError(null);
    setDrafts((current) => {
      const next = current.filter((_, entryIndex) => entryIndex !== index);
      return next.length > 0 ? next : [createEmptyDraft(ingredient.stock_unit)];
    });
  };

  const applySuggestion = (suggestion: ConversionSuggestion) => {
    setSaveError(null);
    const draft = suggestionToDraft(suggestion);

    setDrafts((current) => {
      const emptyIndex = current.findIndex(isEmptyDraft);

      if (emptyIndex >= 0) {
        return current.map((entry, entryIndex) => (entryIndex === emptyIndex ? draft : entry));
      }

      return [...current, draft];
    });
  };

  const availableSuggestions = useMemo(
    () =>
      getAvailableConversionSuggestions(
        drafts,
        masterUnits,
        ingredient.stock_unit,
        ingredient.purchase_unit,
      ),
    [drafts, ingredient.purchase_unit, ingredient.stock_unit, masterUnits],
  );

  const validateDrafts = (): Array<{ from_unit: string; to_unit: string; factor: number }> | null => {
    const parsed: Array<{ from_unit: string; to_unit: string; factor: number }> = [];
    const seen = new Set<string>();

    for (const draft of drafts) {
      if (isEmptyDraft(draft)) {
        continue;
      }

      if (!draft.from_unit.trim()) {
        setSaveError('Each rule needs a “from” unit.');
        return null;
      }

      if (!draft.to_unit.trim()) {
        setSaveError('Each rule needs a “to” unit.');
        return null;
      }

      if (!isMasterUnitSymbol(draft.from_unit, masterUnits)) {
        setSaveError('Choose “from” units from the Master Units List.');
        return null;
      }

      if (!isMasterUnitSymbol(draft.to_unit, masterUnits)) {
        setSaveError('Choose “to” units from the Master Units List.');
        return null;
      }

      if (draft.from_unit === draft.to_unit) {
        setSaveError('“From” and “to” units must be different.');
        return null;
      }

      if (!draft.factor.trim()) {
        setSaveError('Enter the conversion factor (e.g. 12).');
        return null;
      }

      const factor = Number(draft.factor);
      if (Number.isNaN(factor) || factor <= 0) {
        setSaveError('Enter a positive factor for each rule.');
        return null;
      }

      const key = `${draft.from_unit}:${draft.to_unit}`;
      if (seen.has(key)) {
        setSaveError('Remove duplicate conversion rules before saving.');
        return null;
      }
      seen.add(key);

      parsed.push({
        from_unit: draft.from_unit,
        to_unit: draft.to_unit,
        factor,
      });
    }

    return parsed;
  };

  const handleSave = async () => {
    const parsed = validateDrafts();
    if (!parsed) {
      return;
    }

    try {
      setIsSaving(true);
      await replace.mutateAsync({ ingredientId: ingredient.id, conversions: parsed });
      onClose?.();
    } catch (error) {
      Alert.alert('Save failed', formatErrorMessage(error, 'Could not save conversions.'));
    } finally {
      setIsSaving(false);
    }
  };

  const hasFilledDraft = drafts.some((draft) => !isEmptyDraft(draft));

  return (
    <View className="gap-3">
      <Text variant="bodySecondary">
        Define how units convert for this ingredient. Example: 1 {ingredient.stock_unit} = 12 slice.
        Recipes can use the stock unit, purchase unit, and any units defined in conversion rules.
      </Text>

      {availableSuggestions.length > 0 ? (
        <View className="gap-2">
          <Text variant="label">Quick add (Australian standards)</Text>
          <View className="flex-row flex-wrap gap-2">
            {availableSuggestions.map((suggestion) => (
              <Pressable
                key={`${suggestion.from_unit}-${suggestion.to_unit}`}
                accessibilityRole="button"
                accessibilityLabel={`Add ${suggestion.label}`}
                onPress={() => applySuggestion(suggestion)}
                className="rounded-full border border-border bg-surface-secondary px-3 py-1.5 active:opacity-80 dark:border-border-dark dark:bg-surface-dark-secondary">
                <Text className="text-sm">{suggestion.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {drafts.map((draft, index) => (
        <View key={`${draft.from_unit}-${draft.to_unit}-${index}`} className={cn('gap-2', fieldPanelClassName)}>
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="text-sm">1</Text>
            <UnitSelect
              compact
              value={draft.from_unit}
              units={masterUnits}
              onChange={(symbol) => updateDraft(index, { from_unit: symbol })}
              className="min-w-[88px]"
            />
            <Text className="text-sm">=</Text>
            <Input
              value={draft.factor}
              onChangeText={(value) => updateDraft(index, { factor: value })}
              keyboardType="decimal-pad"
              placeholder="12"
              className="w-16"
            />
            <UnitSelect
              compact
              value={draft.to_unit}
              units={masterUnits}
              onChange={(symbol) => updateDraft(index, { to_unit: symbol })}
              className="min-w-[88px]"
            />
            {drafts.length > 1 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove conversion rule"
                onPress={() => removeDraft(index)}
                className="p-1">
                <Ionicons name="close-circle" size={22} color="#DC2626" />
              </Pressable>
            ) : null}
          </View>
        </View>
      ))}

      {!hasFilledDraft ? <Text variant="caption">No conversion rules added yet.</Text> : null}

      {saveError ? <Text className="text-sm text-status-danger">{saveError}</Text> : null}

      <View className="flex-row flex-wrap gap-3">
        <Button label="Add rule" variant="secondary" onPress={addDraft} />
        <Button
          label={isSaving ? 'Saving...' : 'Save conversions'}
          onPress={() => void handleSave()}
          disabled={isSaving}
        />
        {onClose ? <Button label="Close" variant="ghost" onPress={onClose} /> : null}
      </View>
    </View>
  );
}
