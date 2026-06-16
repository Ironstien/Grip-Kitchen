import { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { IngredientConversionsEditor } from '@/components/settings/IngredientConversionsEditor';
import { CategorySelect } from '@/components/ui/CategorySelect';
import { ClipboardImagePicker } from '@/components/ui/ClipboardImagePicker';
import { FormField } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UnitSelect } from '@/components/ui/UnitSelect';
import { Text } from '@/components/ui/Text';
import { useIngredientMutations } from '@/hooks/useIngredients';
import { useUserCategories } from '@/hooks/useUserCategories';
import { useUserUnits } from '@/hooks/useUserUnits';
import { isLocalImageUri, revokeLocalImageUri } from '@/lib/clipboardImage';
import { isMasterCategoryName } from '@/lib/categories';
import { formatPurchaseSummary } from '@/lib/ingredients';
import { isMasterUnitSymbol } from '@/lib/units';
import type { IngredientWithConversions } from '@/types/database';

type IngredientFormProps = {
  ingredient?: IngredientWithConversions | null;
  onSaved: (savedId?: string) => void;
  onCancel: () => void;
};

export function IngredientForm({ ingredient, onSaved, onCancel }: IngredientFormProps) {
  const { create, update, remove, uploadImage } = useIngredientMutations();
  const { data: masterUnits = [] } = useUserUnits();
  const { data: masterCategories = [] } = useUserCategories();

  const [name, setName] = useState(ingredient?.name ?? '');
  const [displayName, setDisplayName] = useState(ingredient?.display_name ?? '');
  const [category, setCategory] = useState(ingredient?.category ?? masterCategories[0]?.name ?? '');
  const [purchasePrice, setPurchasePrice] = useState(String(ingredient?.purchase_price ?? 0));
  const [purchaseQty, setPurchaseQty] = useState(String(ingredient?.purchase_qty ?? 1));
  const [purchaseUnit, setPurchaseUnit] = useState(ingredient?.purchase_unit ?? 'pack');
  const [stockUnit, setStockUnit] = useState(ingredient?.stock_unit ?? ingredient?.purchase_unit ?? 'pack');
  const [imageUrl, setImageUrl] = useState(ingredient?.image_url ?? '');
  const [imageMimeType, setImageMimeType] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(ingredient?.name ?? '');
    setDisplayName(ingredient?.display_name ?? '');
    setCategory(ingredient?.category ?? masterCategories[0]?.name ?? '');
    setPurchasePrice(String(ingredient?.purchase_price ?? 0));
    setPurchaseQty(String(ingredient?.purchase_qty ?? 1));
    setPurchaseUnit(ingredient?.purchase_unit ?? 'pack');
    setStockUnit(ingredient?.stock_unit ?? ingredient?.purchase_unit ?? 'pack');
    setImageUrl((current) => {
      revokeLocalImageUri(current);
      return ingredient?.image_url ?? '';
    });
    setImageMimeType(undefined);
  }, [ingredient, masterCategories]);

  useEffect(() => {
    if (!ingredient && masterCategories.length > 0 && !isMasterCategoryName(category, masterCategories)) {
      setCategory(
        masterCategories.find((entry) => entry.name === 'Pantry')?.name ??
          masterCategories[0]?.name ??
          '',
      );
    }
  }, [category, ingredient, masterCategories]);

  const validate = () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Enter the store product name.');
      return false;
    }

    const parsedPrice = Number(purchasePrice);
    const parsedQty = Number(purchaseQty);

    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      Alert.alert('Invalid price', 'Enter a valid purchase price.');
      return false;
    }

    if (Number.isNaN(parsedQty) || parsedQty <= 0) {
      Alert.alert('Invalid quantity', 'Enter a purchase quantity greater than zero.');
      return false;
    }

    if (!isMasterCategoryName(category, masterCategories)) {
      Alert.alert('Unknown category', 'Choose a category from the Master Category List.');
      return false;
    }

    if (!isMasterUnitSymbol(purchaseUnit, masterUnits)) {
      Alert.alert('Unknown unit', 'Choose a purchase unit from the Master Units List.');
      return false;
    }

    if (!isMasterUnitSymbol(stockUnit, masterUnits)) {
      Alert.alert('Unknown stock unit', 'Choose a stock unit from the Master Units List.');
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
      display_name: displayName.trim(),
      category,
      purchase_price: Number(purchasePrice),
      purchase_qty: Number(purchaseQty),
      purchase_unit: purchaseUnit,
      stock_unit: stockUnit,
      image_url:
        imageUrl && !isLocalImageUri(imageUrl) ? imageUrl : ingredient?.image_url ?? null,
    };

    try {
      setIsSaving(true);

      let savedId = ingredient?.id;

      if (ingredient) {
        await update.mutateAsync({ id: ingredient.id, input: payload });
      } else {
        const saved = await create.mutateAsync(payload);
        savedId = saved.id;
      }

      if (savedId) {
        if (imageUrl && isLocalImageUri(imageUrl)) {
          const publicUrl = await uploadImage.mutateAsync({
            ingredientId: savedId,
            uri: imageUrl,
            mimeType: imageMimeType,
          });
          await update.mutateAsync({
            id: savedId,
            input: { image_url: publicUrl },
          });
        } else if (!imageUrl && ingredient?.image_url) {
          await update.mutateAsync({
            id: savedId,
            input: { image_url: null },
          });
        }
      }

      onSaved(savedId);
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
            void remove.mutateAsync(ingredient.id).then(() => onCancel());
          },
        },
      ],
    );
  };

  const previewSummary =
    Number(purchaseQty) > 0
      ? formatPurchaseSummary({
          purchase_price: Number(purchasePrice) || 0,
          purchase_qty: Number(purchaseQty) || 1,
          purchase_unit: purchaseUnit,
        })
      : null;

  return (
    <ScrollView contentContainerClassName="gap-4 pb-6" keyboardShouldPersistTaps="handled">
      <View className="flex-row gap-4">
        <View className="min-w-0 flex-1 gap-4">
          <FormField label="Store name">
            <Input
              value={name}
              onChangeText={setName}
              placeholder="Exact name from Woolworths receipt"
            />
          </FormField>

          <FormField label="Display name">
            <Input
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Short name shown in recipes"
            />
          </FormField>

          <CategorySelect label="Category" value={category} onChange={setCategory} />
        </View>

        <ClipboardImagePicker
          className="w-[180px] shrink-0"
          value={imageUrl}
          onChange={(uri, mimeType) => {
            revokeLocalImageUri(imageUrl);
            setImageUrl(uri);
            setImageMimeType(mimeType);
          }}
          onClear={() => {
            revokeLocalImageUri(imageUrl);
            setImageUrl('');
            setImageMimeType(undefined);
          }}
        />
      </View>

      <View className="gap-2">
        <Text variant="label">Purchase price (AUD)</Text>
        <Input
          value={purchasePrice}
          onChangeText={setPurchasePrice}
          keyboardType="decimal-pad"
          placeholder="e.g. 6.00"
        />
      </View>

      <View className="flex-row gap-3">
        <FormField label="Purchase QTY" className="flex-1">
          <Input
            value={purchaseQty}
            onChangeText={setPurchaseQty}
            keyboardType="decimal-pad"
            placeholder="e.g. 2"
          />
        </FormField>
        <FormField label="Purchase unit" className="flex-1">
          <UnitSelect value={purchaseUnit} onChange={setPurchaseUnit} />
        </FormField>
      </View>

      <FormField label="Stock unit (pantry)">
        <UnitSelect value={stockUnit} onChange={setStockUnit} />
        <Text variant="caption" className="mt-1">
          How you count this on the shelf — usually pack, bottle, or each.
        </Text>
      </FormField>

      {previewSummary ? (
        <Text variant="bodySecondary">{previewSummary}</Text>
      ) : null}

      {ingredient ? (
        <View className="gap-2 border-t border-border pt-4 dark:border-border-dark">
          <Text variant="label">Unit conversions</Text>
          <IngredientConversionsEditor ingredient={ingredient} />
        </View>
      ) : (
        <Text variant="caption">
          Save the ingredient first, then add conversion rules (e.g. 1 pack = 12 slices).
        </Text>
      )}

      <View className="mt-2 flex-row gap-3">
        <Button label="Cancel" variant="ghost" onPress={onCancel} className="flex-1" />
        <Button
          label={isSaving ? 'Saving...' : ingredient ? 'Save changes' : 'Add ingredient'}
          onPress={() => void handleSave()}
          disabled={isSaving}
          className="flex-1"
        />
      </View>

      {ingredient ? (
        <Button label="Delete ingredient" variant="ghost" onPress={handleDelete} className="mt-2" />
      ) : null}
    </ScrollView>
  );
}
