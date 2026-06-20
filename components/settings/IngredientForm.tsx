import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';

import type { DetailAction } from '@/components/layout/DetailPaneHeader';
import { IngredientConversionsEditor } from '@/components/settings/IngredientConversionsEditor';
import { CategorySelect } from '@/components/ui/CategorySelect';
import { ClipboardImagePicker } from '@/components/ui/ClipboardImagePicker';
import { FormField, ConfirmModal } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UnitSelect } from '@/components/ui/UnitSelect';
import { Text } from '@/components/ui/Text';
import { useIngredientMutations } from '@/hooks/useIngredients';
import { useResponsive } from '@/hooks/useResponsive';
import { useUserCategories } from '@/hooks/useUserCategories';
import { useUserUnits } from '@/hooks/useUserUnits';
import { isLocalImageUri, revokeLocalImageUri } from '@/lib/clipboardImage';
import { isMasterCategoryName } from '@/lib/categories';
import { cn } from '@/lib/cn';
import { formatErrorMessage } from '@/lib/errors';
import { fieldPanelClassName } from '@/lib/fieldStyles';
import { formatPurchaseSummary } from '@/lib/ingredients';
import { isMasterUnitSymbol } from '@/lib/units';
import type { IngredientWithConversions } from '@/types/database';

const DESKTOP_PHOTO_SIZE = 96;

type IngredientFormProps = {
  ingredient?: IngredientWithConversions | null;
  onSaved: (savedId?: string) => void;
  onCancel: () => void;
  onHeaderActionsChange?: (actions: DetailAction[]) => void;
};

export function IngredientForm({
  ingredient,
  onSaved,
  onCancel,
  onHeaderActionsChange,
}: IngredientFormProps) {
  const { isDesktop } = useResponsive();
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleSave = useCallback(async () => {
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
  }, [
    category,
    create,
    displayName,
    imageMimeType,
    imageUrl,
    ingredient,
    name,
    onSaved,
    purchasePrice,
    purchaseQty,
    purchaseUnit,
    stockUnit,
    update,
    uploadImage,
  ]);

  const handleDelete = useCallback(() => {
    if (!ingredient) {
      return;
    }

    setShowDeleteConfirm(true);
  }, [ingredient]);

  const confirmDelete = useCallback(async () => {
    if (!ingredient) {
      return;
    }

    try {
      setIsDeleting(true);
      await remove.mutateAsync(ingredient.id);
      setShowDeleteConfirm(false);
      onCancel();
    } catch (error) {
      Alert.alert('Delete failed', formatErrorMessage(error, 'Delete failed.'));
    } finally {
      setIsDeleting(false);
    }
  }, [ingredient, onCancel, remove]);

  const handleSaveRef = useRef(handleSave);
  const handleDeleteRef = useRef(handleDelete);
  const onCancelRef = useRef(onCancel);

  handleSaveRef.current = handleSave;
  handleDeleteRef.current = handleDelete;
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!isDesktop || !onHeaderActionsChange) {
      return;
    }

    const actions: DetailAction[] = [];

    if (ingredient) {
      actions.push({
        label: 'Delete ingredient',
        variant: 'ghost',
        onPress: () => handleDeleteRef.current(),
      });
    }

    actions.push({
      label: 'Cancel',
      variant: 'ghost',
      onPress: () => onCancelRef.current(),
    });

    actions.push({
      label: isSaving ? 'Saving...' : ingredient ? 'Save changes' : 'Add ingredient',
      variant: 'primary',
      onPress: () => void handleSaveRef.current(),
      disabled: isSaving,
    });

    onHeaderActionsChange(actions);
  }, [ingredient?.id, isDesktop, isSaving, onHeaderActionsChange]);

  const previewSummary =
    Number(purchaseQty) > 0
      ? formatPurchaseSummary({
          purchase_price: Number(purchasePrice) || 0,
          purchase_qty: Number(purchaseQty) || 1,
          purchase_unit: purchaseUnit,
        })
      : null;

  const imagePicker = (
    <ClipboardImagePicker
      className={isDesktop ? 'shrink-0' : 'w-full'}
      size={isDesktop ? DESKTOP_PHOTO_SIZE : undefined}
      height={isDesktop ? undefined : 180}
      compact={isDesktop}
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
  );

  const purchaseRow = (
    <View className="flex-row items-end gap-3">
      <FormField label="Purchase price (AUD)" className="w-[108px] shrink-0">
        <Input
          value={purchasePrice}
          onChangeText={setPurchasePrice}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
      </FormField>

      <FormField label="Purchase QTY" className="w-[72px] shrink-0">
        <Input
          value={purchaseQty}
          onChangeText={setPurchaseQty}
          keyboardType="decimal-pad"
          placeholder="1"
        />
      </FormField>

      <FormField label="Purchase unit" className="min-w-0 flex-1">
        <UnitSelect value={purchaseUnit} onChange={setPurchaseUnit} />
      </FormField>

      <FormField label="Stock unit (pantry)" className="min-w-0 flex-1">
        <UnitSelect value={stockUnit} onChange={setStockUnit} />
      </FormField>

      {previewSummary ? (
        <View
          className={cn(
            'min-h-[32px] shrink-0 justify-center rounded-button px-3 py-2',
            fieldPanelClassName,
          )}>
          <Text variant="bodySecondary">{previewSummary}</Text>
        </View>
      ) : null}
    </View>
  );

  const desktopForm = (
    <View className="flex-row items-center gap-3">
      <View className="min-w-0 flex-1 gap-3">
        <View className="flex-row items-start gap-3">
          <FormField label="Store name" className="min-w-0 flex-[1.4]">
            <Input
              value={name}
              onChangeText={setName}
              placeholder="Exact name from Woolworths receipt"
            />
          </FormField>

          <FormField label="Display name" className="min-w-0 flex-1">
            <Input
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Short name shown in recipes"
            />
          </FormField>

          <CategorySelect
            label="Category"
            value={category}
            onChange={setCategory}
            className="min-w-0 flex-1"
          />
        </View>

        {purchaseRow}
      </View>

      {imagePicker}
    </View>
  );

  const mobileForm = (
    <View className="gap-4">
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
      {imagePicker}
    </View>
  );

  const purchaseFields = isDesktop ? null : (
    <View className="gap-4">
      <FormField label="Purchase price (AUD)">
        <Input
          value={purchasePrice}
          onChangeText={setPurchasePrice}
          keyboardType="decimal-pad"
          placeholder="e.g. 6.00"
        />
      </FormField>

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

      {previewSummary ? <Text variant="bodySecondary">{previewSummary}</Text> : null}
    </View>
  );

  return (
    <View className="gap-4 pb-6">
      {isDesktop ? desktopForm : mobileForm}
      {purchaseFields}

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

      {!isDesktop ? (
        <View className="mt-2 gap-3">
          <View className="flex-row gap-3">
            <Button label="Cancel" variant="ghost" onPress={onCancel} className="flex-1" />
            <Button
              label={isSaving ? 'Saving...' : ingredient ? 'Save changes' : 'Add ingredient'}
              onPress={() => void handleSave()}
              disabled={isSaving}
              className="flex-1"
            />
          </View>

          {ingredient ? (
            <Button label="Delete ingredient" variant="ghost" onPress={handleDelete} />
          ) : null}
        </View>
      ) : null}

      <ConfirmModal
        visible={showDeleteConfirm}
        title="Delete ingredient"
        message={
          ingredient
            ? `Delete ${ingredient.name}? This removes it from the pantry and cannot be undone if used in recipes.`
            : 'Delete this ingredient?'
        }
        confirmLabel={isDeleting ? 'Deleting…' : 'Delete'}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!isDeleting) {
            setShowDeleteConfirm(false);
          }
        }}
      />
    </View>
  );
}
