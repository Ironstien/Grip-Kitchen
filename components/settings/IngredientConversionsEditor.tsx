import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { UnitSelect } from '@/components/ui/UnitSelect';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useIngredientConversionMutations } from '@/hooks/useIngredientConversions';
import { useUserUnits } from '@/hooks/useUserUnits';
import { formatErrorMessage } from '@/lib/errors';
import { fieldPanelClassName } from '@/lib/fieldStyles';
import { isMasterUnitSymbol } from '@/lib/units';
import { cn } from '@/lib/cn';
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

function formatRuleLabel(rule: ConversionDraft): string {
  return `1 ${rule.from_unit} = ${rule.factor} ${rule.to_unit}`;
}

export function IngredientConversionsEditor({
  ingredient,
  onClose,
}: IngredientConversionsEditorProps) {
  const { data: masterUnits = [] } = useUserUnits();
  const { replace } = useIngredientConversionMutations();
  const [savedRules, setSavedRules] = useState<ConversionDraft[]>([]);
  const [draftRule, setDraftRule] = useState<ConversionDraft>(() =>
    createEmptyDraft(ingredient.stock_unit),
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSavedRules(ingredient.ingredient_conversions.map(toDraft));
    setDraftRule(createEmptyDraft(ingredient.stock_unit));
  }, [ingredient]);

  const updateDraftRule = (patch: Partial<ConversionDraft>) => {
    setDraftRule((current) => ({ ...current, ...patch }));
  };

  const resetDraftRule = () => {
    setDraftRule(createEmptyDraft(ingredient.stock_unit));
  };

  const parseRule = (
    draft: ConversionDraft,
  ): { from_unit: string; to_unit: string; factor: number } | null => {
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

    return {
      from_unit: draft.from_unit,
      to_unit: draft.to_unit,
      factor,
    };
  };

  const commitDraftRule = () => {
    const parsed = parseRule(draftRule);
    if (!parsed) {
      return;
    }

    const duplicate = savedRules.some(
      (rule) => rule.from_unit === parsed.from_unit && rule.to_unit === parsed.to_unit,
    );
    if (duplicate) {
      Alert.alert('Duplicate rule', 'That conversion rule already exists.');
      return;
    }

    setSavedRules((current) => [
      ...current,
      {
        from_unit: parsed.from_unit,
        to_unit: parsed.to_unit,
        factor: String(parsed.factor),
      },
    ]);
    resetDraftRule();
  };

  const removeRule = (index: number) => {
    setSavedRules((current) => current.filter((_, entryIndex) => entryIndex !== index));
  };

  const handleSave = async () => {
    const parsed = savedRules.map((draft) => ({
      from_unit: draft.from_unit,
      to_unit: draft.to_unit,
      factor: Number(draft.factor),
    }));

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
        Recipes can use the stock unit, purchase unit, and any units defined in conversion rules.
      </Text>

      <View className={cn('gap-2', fieldPanelClassName)}>
        <View className="flex-row flex-wrap items-center gap-2">
          <Text className="text-sm">1</Text>
          <UnitSelect
            compact
            value={draftRule.from_unit}
            units={masterUnits}
            onChange={(symbol) => updateDraftRule({ from_unit: symbol })}
            className="min-w-[88px]"
          />
          <Text className="text-sm">=</Text>
          <Input
            value={draftRule.factor}
            onChangeText={(value) => updateDraftRule({ factor: value })}
            keyboardType="decimal-pad"
            placeholder="12"
            className="w-16"
          />
          <UnitSelect
            compact
            value={draftRule.to_unit}
            units={masterUnits}
            onChange={(symbol) => updateDraftRule({ to_unit: symbol })}
            className="min-w-[88px]"
          />
        </View>
        <Button label="Add rule" onPress={commitDraftRule} />
      </View>

      {savedRules.length > 0 ? (
        <View className="gap-1.5">
          {savedRules.map((rule, index) => (
            <View
              key={`${rule.from_unit}-${rule.to_unit}-${index}`}
              className={cn('flex-row items-center gap-2 py-2', fieldPanelClassName)}>
              <Text className="flex-1 text-sm">{formatRuleLabel(rule)}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${formatRuleLabel(rule)}`}
                onPress={() => removeRule(index)}
                className="p-1">
                <Ionicons name="close-circle" size={22} color="#DC2626" />
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <Text variant="caption">No conversion rules added yet.</Text>
      )}

      <View className="flex-row flex-wrap gap-3">
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
