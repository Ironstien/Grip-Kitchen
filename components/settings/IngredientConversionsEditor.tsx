import { useEffect, useState } from 'react';
import { Alert, TextInput, View } from 'react-native';

import { UnitSelect } from '@/components/ui/UnitSelect';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useIngredientConversionMutations } from '@/hooks/useIngredientConversions';
import { useUserUnits } from '@/hooks/useUserUnits';
import { formatErrorMessage } from '@/lib/errors';
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

export function IngredientConversionsEditor({
  ingredient,
  onClose,
}: IngredientConversionsEditorProps) {
  const { data: masterUnits = [] } = useUserUnits();
  const { replace } = useIngredientConversionMutations();
  const [drafts, setDrafts] = useState<ConversionDraft[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const existing = ingredient.ingredient_conversions.map(toDraft);
    setDrafts(existing.length > 0 ? existing : [createEmptyDraft(ingredient.stock_unit)]);
  }, [ingredient]);

  const updateDraft = (index: number, patch: Partial<ConversionDraft>) => {
    setDrafts((current) =>
      current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, ...patch } : entry)),
    );
  };

  const addDraft = () => {
    setDrafts((current) => [...current, createEmptyDraft(ingredient.stock_unit)]);
  };

  const removeDraft = (index: number) => {
    setDrafts((current) => current.filter((_, entryIndex) => entryIndex !== index));
  };

  const validate = (): Array<{ from_unit: string; to_unit: string; factor: number }> | null => {
    const parsed: Array<{ from_unit: string; to_unit: string; factor: number }> = [];

    for (const draft of drafts) {
      if (!draft.from_unit && !draft.to_unit && !draft.factor.trim()) {
        continue;
      }

      if (!isMasterUnitSymbol(draft.from_unit, masterUnits)) {
        Alert.alert('Invalid conversion', 'Choose a valid “from” unit.');
        return null;
      }

      if (!isMasterUnitSymbol(draft.to_unit, masterUnits)) {
        Alert.alert('Invalid conversion', 'Choose a valid “to” unit.');
        return null;
      }

      if (draft.from_unit === draft.to_unit) {
        Alert.alert('Invalid conversion', '“From” and “to” units must be different.');
        return null;
      }

      const factor = Number(draft.factor);
      if (Number.isNaN(factor) || factor <= 0) {
        Alert.alert('Invalid conversion', 'Enter a positive factor.');
        return null;
      }

      parsed.push({
        from_unit: draft.from_unit,
        to_unit: draft.to_unit,
        factor,
      });
    }

    return parsed;
  };

  const handleSave = async () => {
    const parsed = validate();
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

  return (
    <View className="gap-3">
      <Text variant="bodySecondary">
        Define how units convert for this ingredient. Example: 1 {ingredient.stock_unit} = 12 slice.
        Recipes can only use units reachable from the pantry stock unit ({ingredient.stock_unit}).
      </Text>

      {drafts.map((draft, index) => (
        <View
          key={`${draft.from_unit}-${draft.to_unit}-${index}`}
          className="flex-row flex-wrap items-center gap-2 rounded-card border border-border p-3 dark:border-border-dark">
          <Text className="text-sm">1</Text>
          <UnitSelect
            compact
            value={draft.from_unit}
            units={masterUnits}
            onChange={(symbol) => updateDraft(index, { from_unit: symbol })}
            className="min-w-[88px]"
          />
          <Text className="text-sm">=</Text>
          <TextInput
            value={draft.factor}
            onChangeText={(value) => updateDraft(index, { factor: value })}
            keyboardType="decimal-pad"
            placeholder="12"
            className="w-16 rounded border border-border px-2 py-1 text-sm text-text dark:border-border-dark dark:text-text-dark"
          />
          <UnitSelect
            compact
            value={draft.to_unit}
            units={masterUnits}
            onChange={(symbol) => updateDraft(index, { to_unit: symbol })}
            className="min-w-[88px]"
          />
          <Button label="Remove" variant="ghost" onPress={() => removeDraft(index)} />
        </View>
      ))}

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
