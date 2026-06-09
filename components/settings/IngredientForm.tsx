import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { FormField, OptionSelect } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UnitSelect } from '@/components/ui/UnitSelect';
import { Text } from '@/components/ui/Text';
import { INVENTORY_CATEGORIES } from '@/constants/inventory';
import { useIngredientMutations } from '@/hooks/useIngredients';
import { useUserUnits } from '@/hooks/useUserUnits';
import { isMasterUnitSymbol } from '@/lib/units';
import type { Ingredient } from '@/types/database';

type IngredientFormProps = {
  ingredient?: Ingredient | null;
  onSaved: () => void;
  onCancel: () => void;
};

export function IngredientForm({ ingredient, onSaved, onCancel }: IngredientFormProps) {
  const { create, update, remove } = useIngredientMutations();
  const { data: masterUnits = [] } = useUserUnits();

  const [name, setName] = useState(ingredient?.name ?? '');
  const [category, setCategory] = useState(ingredient?.category ?? INVENTORY_CATEGORIES[0]);
  const [unit, setUnit] = useState(ingredient?.unit_of_measure ?? 'each');
  const [pricePerUnit, setPricePerUnit] = useState(String(ingredient?.price_per_unit ?? 0));
  const [priceUnit, setPriceUnit] = useState(
    ingredient?.price_unit_of_measure ?? ingredient?.unit_of_measure ?? 'each',
  );
  const [isSaving, setIsSaving] = useState(false);

  const validate = () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Enter an ingredient name.');
      return false;
    }

    const parsedPrice = Number(pricePerUnit);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      Alert.alert('Invalid price', 'Enter a valid price amount.');
      return false;
    }

    if (!isMasterUnitSymbol(unit, masterUnits)) {
      Alert.alert('Unknown unit', 'Choose a unit from the Master Units List.');
      return false;
    }

    if (!isMasterUnitSymbol(priceUnit, masterUnits)) {
      Alert.alert('Unknown price unit', 'Choose a unit from the Master Units List.');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    const payload = {
      name: name.trim(),
      category,
      unit_of_measure: unit,
      price_per_unit: Number(pricePerUnit),
      price_unit_of_measure: priceUnit,
    };

    try {
      setIsSaving(true);

      if (ingredient) {
        await update.mutateAsync({ id: ingredient.id, input: payload });
      } else {
        await create.mutateAsync(payload);
      }

      onSaved();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Save failed.';
      Alert.alert('Save failed', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!ingredient) {
      return;
    }

    Alert.alert(
      'Delete ingredient',
      `Delete ${ingredient.name}? This removes it from the pantry and cannot be undone if used in recipes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void remove.mutateAsync(ingredient.id).then(onSaved);
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerClassName="gap-4 pb-6" keyboardShouldPersistTaps="handled">
      <FormField label="Name">
        <Input value={name} onChangeText={setName} placeholder="e.g. Plain flour" />
      </FormField>

      <OptionSelect
        label="Category"
        value={category}
        options={[...INVENTORY_CATEGORIES]}
        onChange={setCategory}
      />

      <UnitSelect label="Default unit" value={unit} onChange={setUnit} />

      <View className="gap-2">
        <Text variant="label">Price per unit (AUD)</Text>
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Input
              value={pricePerUnit}
              onChangeText={setPricePerUnit}
              keyboardType="decimal-pad"
              placeholder="e.g. 5"
            />
          </View>
          <Text variant="bodySecondary">per</Text>
          <UnitSelect value={priceUnit} onChange={setPriceUnit} className="flex-1" />
        </View>
      </View>

      <View className="mt-2 flex-row gap-3">
        <Button label="Cancel" variant="ghost" onPress={onCancel} className="flex-1" />
        <Button
          label={isSaving ? 'Saving...' : ingredient ? 'Save changes' : 'Add ingredient'}
          onPress={() => void handleSave()}
          disabled={isSaving}
          className="flex-1"
        />
      </View>

      {ingredient && (
        <Button label="Delete ingredient" variant="ghost" onPress={handleDelete} className="mt-2" />
      )}
    </ScrollView>
  );
}
