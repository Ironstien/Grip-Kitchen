import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, View } from 'react-native';

import { FormField, OptionSelect } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useIngredients } from '@/hooks/useIngredients';
import { useInventoryMutations } from '@/hooks/useInventory';
import { useStorageLocations } from '@/hooks/useStorageLocations';
import { getIngredientDisplayName } from '@/lib/ingredients';
import type { PantryItem } from '@/lib/inventory/pantry';

type PantryStockFormProps = {
  item?: PantryItem | null;
  onSaved: () => void;
  onCancel: () => void;
  dense?: boolean;
};

function parseDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateInput(date: Date | null): string | null {
  if (!date) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function PantryStockForm({ item, onSaved, onCancel, dense = false }: PantryStockFormProps) {
  const { data: ingredients = [] } = useIngredients();
  const { data: locations = [] } = useStorageLocations();
  const { create, update, remove } = useInventoryMutations();

  const [ingredientId, setIngredientId] = useState(item?.ingredient_id ?? ingredients[0]?.id ?? '');
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 0));
  const [expirationDate, setExpirationDate] = useState<Date | null>(parseDate(item?.expiration_date));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [locationId, setLocationId] = useState(item?.location_id ?? locations[0]?.id ?? '');
  const [minThreshold, setMinThreshold] = useState(String(item?.min_threshold ?? 0));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!item?.location_id && locations[0]?.id && !locationId) {
      setLocationId(locations[0].id);
    }
  }, [item?.location_id, locationId, locations]);

  useEffect(() => {
    if (!item && ingredients[0]?.id && !ingredientId) {
      setIngredientId(ingredients[0].id);
    }
  }, [ingredientId, ingredients, item]);

  const ingredientOptions = useMemo(
    () =>
      ingredients.map((ingredient) => ({
        id: ingredient.id,
        name: getIngredientDisplayName(ingredient),
      })),
    [ingredients],
  );

  const selectedIngredient = ingredients.find((entry) => entry.id === ingredientId);

  const validate = () => {
    if (!ingredientId) {
      Alert.alert('Missing ingredient', 'Choose an ingredient from the master list.');
      return false;
    }

    const parsedQuantity = Number(quantity);
    const parsedThreshold = Number(minThreshold);

    if (Number.isNaN(parsedQuantity) || parsedQuantity < 0) {
      Alert.alert('Invalid quantity', 'Enter a valid quantity.');
      return false;
    }

    if (Number.isNaN(parsedThreshold) || parsedThreshold < 0) {
      Alert.alert('Invalid threshold', 'Enter a valid minimum threshold.');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    const payload = {
      ingredient_id: ingredientId,
      quantity: Number(quantity),
      expiration_date: formatDateInput(expirationDate),
      location_id: locationId || null,
      min_threshold: Number(minThreshold),
    };

    try {
      setIsSaving(true);

      if (item) {
        await update.mutateAsync({ id: item.id, input: payload });
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

  const handleRemove = () => {
    if (!item) {
      return;
    }

    Alert.alert('Remove from pantry', `Remove ${item.name} from your pantry?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void remove.mutateAsync(item.id).then(onSaved);
        },
      },
    ]);
  };

  if (ingredients.length === 0) {
    return (
      <View className="gap-3">
        <Text variant="bodySecondary">
          Add ingredients to the master list in Settings before adding them to your pantry.
        </Text>
        <Button label="Close" variant="ghost" onPress={onCancel} />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName={dense ? 'gap-4 pb-8' : 'gap-5 pb-10'}
      keyboardShouldPersistTaps="handled">
      {item ? (
        <View className="rounded-card border border-border px-4 py-3 dark:border-border-dark">
          <Text className="text-lg font-semibold">{getIngredientDisplayName(item)}</Text>
          <Text variant="bodySecondary">{item.name}</Text>
          <Text variant="bodySecondary">
            {item.category} · {item.stock_unit}
          </Text>
          <Text variant="caption" className="mt-1">
            Edit ingredient details in Settings → Master Ingredient List.
          </Text>
        </View>
      ) : (
        <OptionSelect
          label="Ingredient"
          value={ingredientOptions.find((entry) => entry.id === ingredientId)?.name ?? ''}
          options={ingredientOptions.map((entry) => entry.name)}
          onChange={(selectedName) => {
            const match = ingredientOptions.find((entry) => entry.name === selectedName);
            if (match) {
              setIngredientId(match.id);
            }
          }}
        />
      )}

      {selectedIngredient && !item && (
        <Text variant="caption">
          Stock unit: {selectedIngredient.stock_unit} · {selectedIngredient.category}
        </Text>
      )}

      <FormField label={`Quantity${selectedIngredient ? ` (${selectedIngredient.stock_unit})` : ''}`}>
        <Input value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" />
      </FormField>

      <FormField label="Expiration date">
        <Pressable
          onPress={() => setShowDatePicker(true)}
          className="min-h-[32px] justify-center rounded-button border border-border px-2 dark:border-border-dark">
          <Text>{expirationDate ? formatDateInput(expirationDate) : 'No expiration date'}</Text>
        </Pressable>
        {expirationDate && (
          <Button
            label="Clear date"
            variant="ghost"
            onPress={() => setExpirationDate(null)}
            className="mt-2 self-start"
          />
        )}
        {showDatePicker && (
          <DateTimePicker
            value={expirationDate ?? new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (date) {
                setExpirationDate(date);
              }
            }}
          />
        )}
      </FormField>

      <OptionSelect
        label="Storage location"
        value={locations.find((location) => location.id === locationId)?.name ?? ''}
        options={locations.map((location) => location.name)}
        onChange={(selectedName) => {
          const match = locations.find((location) => location.name === selectedName);
          if (match) {
            setLocationId(match.id);
          }
        }}
      />

      <FormField label="Minimum threshold">
        <Input value={minThreshold} onChangeText={setMinThreshold} keyboardType="decimal-pad" />
      </FormField>

      <View className="mt-2 flex-row gap-3">
        <Button label="Cancel" variant="ghost" onPress={onCancel} className="flex-1" />
        <Button
          label={isSaving ? 'Saving...' : item ? 'Save stock' : 'Add to pantry'}
          onPress={() => void handleSave()}
          disabled={isSaving}
          className="flex-1"
        />
      </View>

      {item && (
        <Button label="Remove from pantry" variant="ghost" onPress={handleRemove} className="mt-2" />
      )}
    </ScrollView>
  );
}
