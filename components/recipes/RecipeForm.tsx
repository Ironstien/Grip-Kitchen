import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import {
  RECIPE_DESKTOP_HERO_HEIGHT,
  RecipeDesktopLayout,
} from '@/components/recipes/RecipeDesktopLayout';
import { DietaryTagsEditor } from '@/components/recipes/DietaryTagsEditor';
import { RecipeIngredientList } from '@/components/recipes/RecipeIngredientList';
import { AutocompleteInput } from '@/components/ui/AutocompleteInput';
import { ClipboardImagePicker } from '@/components/ui/ClipboardImagePicker';
import { FormField, ConfirmModal } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Text } from '@/components/ui/Text';
import { isLocalImageUri, revokeLocalImageUri } from '@/lib/clipboardImage';
import { useIngredients } from '@/hooks/useIngredients';
import { useResponsive } from '@/hooks/useResponsive';
import { useRecipeMutations, useRecipeScaling } from '@/hooks/useRecipes';
import { getIngredientSelectableUnits } from '@/lib/ingredientConversions';
import { fieldPanelClassName, fieldSurfaceClassName } from '@/lib/fieldStyles';
import { getIngredientDisplayName } from '@/lib/ingredients';
import { cn } from '@/lib/cn';
import { normalizeUnitSymbol } from '@/lib/units';
import type { IngredientWithConversions } from '@/types/database';
import type { RecipeWithIngredients } from '@/lib/services/recipes';

type DraftIngredient = {
  ingredient_id: string;
  required_quantity: string;
  required_unit: string;
};

const EMPTY_DRAFT: DraftIngredient = {
  ingredient_id: '',
  required_quantity: '1',
  required_unit: 'each',
};

type RecipeFormProps = {
  recipe?: RecipeWithIngredients | null;
  onSaved: (recipeId: string) => void;
  onCancel: () => void;
  onDeleted?: () => void;
};

export function RecipeForm({ recipe, onSaved, onCancel, onDeleted }: RecipeFormProps) {
  const { isDesktop } = useResponsive();
  const { data: ingredientsCatalog = [] } = useIngredients();
  const { create, update, remove, uploadHeroImage } = useRecipeMutations();

  const [title, setTitle] = useState(recipe?.title ?? '');
  const [instructions, setInstructions] = useState(recipe?.instructions ?? '');
  const [baseServings, setBaseServings] = useState(String(recipe?.base_serving_size ?? 4));
  const [timeToCook, setTimeToCook] = useState(
    recipe?.time_to_cook != null ? String(recipe.time_to_cook) : '',
  );
  const [heroImageUrl, setHeroImageUrl] = useState(recipe?.hero_image_url ?? '');
  const [heroImageMimeType, setHeroImageMimeType] = useState<string | undefined>();
  const [selectedTags, setSelectedTags] = useState<string[]>(recipe?.dietary_tags ?? []);
  const [ingredients, setIngredients] = useState<DraftIngredient[]>(
    recipe?.recipe_ingredients.map((ingredient) => ({
      ingredient_id: ingredient.ingredient_id,
      required_quantity: String(ingredient.required_quantity),
      required_unit: ingredient.required_unit,
    })) ?? [],
  );
  const [draftIngredient, setDraftIngredient] = useState<DraftIngredient>(EMPTY_DRAFT);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const ingredientOptions = useMemo(
    () =>
      ingredientsCatalog.map((item) => ({
        id: item.id,
        label: getIngredientDisplayName(item),
        keywords: `${item.name} ${item.display_name}`.toLowerCase(),
      })),
    [ingredientsCatalog],
  );

  const getCatalogItem = (ingredientId: string): IngredientWithConversions | null => {
    const catalogItem = ingredientsCatalog.find((item) => item.id === ingredientId);
    if (!catalogItem) {
      return null;
    }

    if ((catalogItem.ingredient_conversions?.length ?? 0) > 0) {
      return catalogItem;
    }

    const nested = recipe?.recipe_ingredients.find(
      (entry) => entry.ingredient_id === ingredientId,
    )?.ingredient;

    if ((nested?.ingredient_conversions?.length ?? 0) > 0) {
      return {
        ...catalogItem,
        ingredient_conversions: nested!.ingredient_conversions,
      };
    }

    return catalogItem;
  };

  const draftUnitOptions = useMemo(() => {
    if (!draftIngredient.ingredient_id) {
      return [];
    }

    const catalogItem = getCatalogItem(draftIngredient.ingredient_id);
    if (!catalogItem) {
      return [];
    }

    return getIngredientSelectableUnits(catalogItem);
  }, [draftIngredient.ingredient_id, ingredientsCatalog, recipe?.recipe_ingredients]);

  const previewRecipe = useMemo(() => {
    const parsedBaseServings = Number(baseServings) || 4;

    return {
      id: recipe?.id ?? 'draft',
      user_id: recipe?.user_id ?? '',
      title: title || 'Draft recipe',
      instructions,
      base_serving_size: parsedBaseServings,
      time_to_cook: timeToCook.trim() ? Number(timeToCook) : null,
      dietary_tags: selectedTags,
      hero_image_url: heroImageUrl || null,
      recipe_ingredients: ingredients.map((entry, index) => {
        const catalogItem = getCatalogItem(entry.ingredient_id);

        return {
          id: recipe?.recipe_ingredients[index]?.id ?? `draft-${index}`,
          recipe_id: recipe?.id ?? 'draft',
          ingredient_id: entry.ingredient_id,
          required_quantity: Number(entry.required_quantity) || 0,
          required_unit: entry.required_unit || catalogItem?.stock_unit || 'each',
          ingredient: catalogItem
            ? {
                id: catalogItem.id,
                name: catalogItem.name,
                display_name: catalogItem.display_name,
                stock_unit: catalogItem.stock_unit,
                purchase_price: catalogItem.purchase_price,
                purchase_qty: catalogItem.purchase_qty,
                purchase_unit: catalogItem.purchase_unit,
                unit_of_measure: catalogItem.stock_unit,
                price_per_unit: catalogItem.price_per_unit,
                price_unit_of_measure: catalogItem.purchase_unit,
                category: catalogItem.category,
                ingredient_conversions: catalogItem.ingredient_conversions,
              }
            : null,
        };
      }),
    } satisfies RecipeWithIngredients;
  }, [
    baseServings,
    heroImageUrl,
    ingredients,
    instructions,
    ingredientsCatalog,
    recipe?.id,
    recipe?.recipe_ingredients,
    recipe?.user_id,
    selectedTags,
    timeToCook,
    title,
  ]);

  const { targetServings, setTargetServings } = useRecipeScaling(Number(baseServings) || 4);

  const getAllowedUnitsForIngredient = (ingredientId: string): string[] => {
    const catalogItem = getCatalogItem(ingredientId);
    if (!catalogItem) {
      return [];
    }

    return getIngredientSelectableUnits(catalogItem);
  };

  const unitIsAllowed = (ingredientId: string, unit: string): boolean => {
    const allowed = getAllowedUnitsForIngredient(ingredientId);
    const normalized = normalizeUnitSymbol(unit);
    return allowed.some((entry) => normalizeUnitSymbol(entry) === normalized);
  };

  const updateDraftIngredient = (patch: Partial<DraftIngredient>) => {
    setDraftIngredient((current) => ({ ...current, ...patch }));
  };

  const resetDraftIngredient = () => {
    setDraftIngredient({ ...EMPTY_DRAFT });
  };

  const commitDraftIngredient = () => {
    if (!draftIngredient.ingredient_id) {
      Alert.alert('Missing ingredient', 'Select an ingredient before adding.');
      return;
    }

    const parsedQuantity = Number(draftIngredient.required_quantity);
    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert('Invalid quantity', 'Enter a quantity greater than zero.');
      return;
    }

    if (!unitIsAllowed(draftIngredient.ingredient_id, draftIngredient.required_unit)) {
      Alert.alert(
        'Invalid unit',
        'Choose a stock, purchase, or conversion unit defined for this ingredient in Settings.',
      );
      return;
    }

    setIngredients((current) => [...current, { ...draftIngredient }]);
    resetDraftIngredient();
  };

  const removeIngredient = (index: number) => {
    setIngredients((current) => current.filter((_, entryIndex) => entryIndex !== index));
  };

  const setHeroImageFromPicker = (uri: string, mimeType?: string) => {
    revokeLocalImageUri(heroImageUrl);
    setHeroImageUrl(uri);
    setHeroImageMimeType(mimeType);
  };

  const clearHeroImage = () => {
    revokeLocalImageUri(heroImageUrl);
    setHeroImageUrl('');
    setHeroImageMimeType(undefined);
  };

  const setHeroImageFromUrl = (url: string) => {
    revokeLocalImageUri(heroImageUrl);
    setHeroImageUrl(url);
    setHeroImageMimeType(undefined);
  };

  const validate = (): Array<{
    ingredient_id: string;
    required_quantity: number;
    required_unit: string;
  }> | null => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Enter a recipe title.');
      return null;
    }

    const parsedBaseServings = Number(baseServings);
    if (Number.isNaN(parsedBaseServings) || parsedBaseServings <= 0) {
      Alert.alert('Invalid servings', 'Base serving size must be greater than zero.');
      return null;
    }

    const parsedIngredients = ingredients.map((entry) => ({
      ingredient_id: entry.ingredient_id,
      required_quantity: Number(entry.required_quantity),
      required_unit: entry.required_unit,
    }));

    if (parsedIngredients.length === 0) {
      Alert.alert('Missing ingredients', 'Add at least one ingredient.');
      return null;
    }

    if (
      parsedIngredients.some(
        (entry) => Number.isNaN(entry.required_quantity) || entry.required_quantity <= 0,
      )
    ) {
      Alert.alert('Invalid ingredients', 'Each ingredient needs a quantity greater than zero.');
      return null;
    }

    for (const entry of parsedIngredients) {
      if (!unitIsAllowed(entry.ingredient_id, entry.required_unit)) {
        Alert.alert(
          'Invalid unit',
          'A saved ingredient uses a unit that is not defined for that item in Settings.',
        );
        return null;
      }
    }

    return parsedIngredients;
  };

  const handleDelete = () => {
    if (!recipe) {
      return;
    }

    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!recipe) {
      return;
    }

    try {
      setIsDeleting(true);
      await remove.mutateAsync(recipe.id);
      setShowDeleteConfirm(false);
      (onDeleted ?? onCancel)();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Delete failed.';
      Alert.alert('Delete failed', message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    const parsedIngredients = validate();
    if (!parsedIngredients) {
      return;
    }

    const payload = {
      title: title.trim(),
      instructions: instructions.trim(),
      base_serving_size: Number(baseServings),
      time_to_cook: timeToCook.trim() ? Number(timeToCook) : null,
      dietary_tags: selectedTags,
      hero_image_url:
        heroImageUrl && !isLocalImageUri(heroImageUrl) ? heroImageUrl : recipe?.hero_image_url ?? null,
      ingredients: parsedIngredients,
    };

    try {
      setIsSaving(true);
      let savedRecipeId = recipe?.id ?? '';

      if (recipe) {
        const saved = await update.mutateAsync({ id: recipe.id, input: payload });
        savedRecipeId = saved.id;
      } else {
        const saved = await create.mutateAsync(payload);
        savedRecipeId = saved.id;
      }

      if (heroImageUrl && isLocalImageUri(heroImageUrl)) {
        const publicUrl = await uploadHeroImage.mutateAsync({
          recipeId: savedRecipeId,
          uri: heroImageUrl,
          mimeType: heroImageMimeType,
        });
        await update.mutateAsync({
          id: savedRecipeId,
          input: { hero_image_url: publicUrl },
        });
      } else if (heroImageUrl && !isLocalImageUri(heroImageUrl)) {
        await update.mutateAsync({
          id: savedRecipeId,
          input: { hero_image_url: heroImageUrl },
        });
      }

      onSaved(savedRecipeId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Save failed.';
      Alert.alert('Save failed', message);
    } finally {
      setIsSaving(false);
    }
  };

  const heroImagePreview = (
    <ClipboardImagePicker
      value={heroImageUrl || null}
      height={RECIPE_DESKTOP_HERO_HEIGHT}
      label=""
      emptyLabel="Photo required for recipe cards — click to paste"
      onChange={setHeroImageFromPicker}
      onClear={clearHeroImage}
    />
  );

  const heroPhotoControls = (
    <Input
      value={heroImageUrl.startsWith('http') ? heroImageUrl : ''}
      onChangeText={setHeroImageFromUrl}
      placeholder="Or paste an image URL"
    />
  );

  const heroPhotoField = (
    <FormField label="Hero photo">
      <ClipboardImagePicker
        value={heroImageUrl || null}
        height={220}
        label=""
        emptyLabel="Photo required for recipe cards — click to paste"
        onChange={setHeroImageFromPicker}
        onClear={clearHeroImage}
      />
      <Input
        className="mt-3"
        value={heroImageUrl.startsWith('http') ? heroImageUrl : ''}
        onChangeText={setHeroImageFromUrl}
        placeholder="Or paste an image URL"
      />
    </FormField>
  );

  const metadataFields = (
    <View className="gap-4">
      <FormField label="Title">
        <Input value={title} onChangeText={setTitle} placeholder="Recipe title" />
      </FormField>

      <View className="flex-row gap-3">
        <FormField label="Base servings" className="flex-1">
          <Input value={baseServings} onChangeText={setBaseServings} keyboardType="decimal-pad" />
        </FormField>
        <FormField label="Time to cook (min)" className="flex-1">
          <Input value={timeToCook} onChangeText={setTimeToCook} keyboardType="number-pad" />
        </FormField>
      </View>

      {isDesktop ? (
        <View className="gap-3">
          <Text variant="label">Hero photo</Text>
          {heroPhotoControls}
        </View>
      ) : null}
    </View>
  );

  const ingredientsFields = (
    <View className="gap-3">
      <Text variant="label">Ingredients</Text>

      <View className={cn('gap-2', fieldPanelClassName)}>
        <AutocompleteInput
          label="Ingredient"
          value={draftIngredient.ingredient_id}
          options={ingredientOptions}
          placeholder="Type to search ingredients"
          onChange={(ingredientId) => {
            const catalogItem = getCatalogItem(ingredientId);
            const allowedUnits = catalogItem ? getIngredientSelectableUnits(catalogItem) : [];
            const stockUnit = catalogItem?.stock_unit ?? '';
            const defaultUnit =
              allowedUnits.find((unit) => normalizeUnitSymbol(unit) === normalizeUnitSymbol(stockUnit)) ??
              allowedUnits[0] ??
              'each';

            updateDraftIngredient({
              ingredient_id: ingredientId,
              required_unit: defaultUnit,
            });
          }}
        />
        <View className="flex-row gap-3">
          <FormField label="Quantity" className="flex-1">
            <Input
              value={draftIngredient.required_quantity}
              onChangeText={(value) => updateDraftIngredient({ required_quantity: value })}
              keyboardType="decimal-pad"
            />
          </FormField>
          <View className="flex-1">
            <Select
              label="Unit"
              value={draftIngredient.required_unit}
              options={draftUnitOptions}
              placeholder={draftIngredient.ingredient_id ? 'Select unit' : 'Select ingredient first'}
              disabled={!draftIngredient.ingredient_id || draftUnitOptions.length === 0}
              onChange={(unit) => updateDraftIngredient({ required_unit: unit })}
            />
          </View>
        </View>
        <Button label="Add ingredient" onPress={commitDraftIngredient} />
      </View>

      {ingredients.length > 0 ? (
        <View className="gap-1.5">
          {ingredients.map((entry, index) => {
            const catalogItem = ingredientsCatalog.find((item) => item.id === entry.ingredient_id);
            const name = catalogItem ? getIngredientDisplayName(catalogItem) : 'Unknown ingredient';

            return (
              <View
                key={`${entry.ingredient_id}-${index}`}
                className={cn('flex-row items-center gap-2 py-2', fieldPanelClassName)}>
                <View className="flex-1">
                  <Text className="text-sm font-medium">{name}</Text>
                  <Text variant="caption">
                    {entry.required_quantity} {entry.required_unit}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${name}`}
                  onPress={() => removeIngredient(index)}
                  className="p-1">
                  <Ionicons name="close-circle" size={22} color="#DC2626" />
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : (
        <Text variant="caption">No ingredients added yet.</Text>
      )}

      {previewRecipe.recipe_ingredients.length > 0 && (
        <View className="gap-3">
          <Text variant="label">Live preview</Text>
          <View className="flex-row items-center gap-3">
            <Button
              label="-"
              variant="ghost"
              onPress={() => setTargetServings(Math.max(1, targetServings - 1))}
            />
            <Text>{targetServings} servings</Text>
            <Button label="+" variant="ghost" onPress={() => setTargetServings(targetServings + 1)} />
          </View>
          <RecipeIngredientList recipe={previewRecipe} targetServings={targetServings} />
        </View>
      )}
    </View>
  );

  const instructionsField = (
    <FormField label="Instructions">
      <Input
        value={instructions}
        onChangeText={setInstructions}
        placeholder="Step-by-step instructions"
        multiline
        className={isDesktop ? 'min-h-[240px] align-top' : 'min-h-[160px] align-top'}
      />
    </FormField>
  );

  const dietaryTagsField = (
    <DietaryTagsEditor selectedTags={selectedTags} onChange={setSelectedTags} />
  );

  const actionButtons = (
    <View className="gap-3">
      {recipe ? (
        <Button label="Delete recipe" variant="ghost" onPress={handleDelete} />
      ) : null}
      <View className="flex-row gap-3">
        <Button label="Cancel" variant="ghost" onPress={onCancel} className="flex-1" />
        <Button
          label={isSaving ? 'Saving...' : recipe ? 'Save recipe' : 'Create recipe'}
          onPress={() => void handleSave()}
          disabled={isSaving}
          className="flex-1"
        />
      </View>
    </View>
  );

  return (
    <>
      <ScrollView contentContainerClassName="gap-5 pb-12" keyboardShouldPersistTaps="handled">
        {isDesktop ? (
          <>
            {metadataFields}
            <RecipeDesktopLayout
              heroImage={heroImagePreview}
              ingredients={ingredientsFields}
              instructions={instructionsField}
              footer={dietaryTagsField}
            />
          </>
        ) : (
          <>
            {metadataFields}
            {heroPhotoField}
            {ingredientsFields}
            {instructionsField}
            {dietaryTagsField}
          </>
        )}
        {actionButtons}
      </ScrollView>

      <ConfirmModal
        visible={showDeleteConfirm}
        title="Delete recipe"
        message={
          recipe ? `Delete "${recipe.title}"? This cannot be undone.` : 'Delete this recipe?'
        }
        confirmLabel={isDeleting ? 'Deleting…' : 'Delete'}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!isDeleting) {
            setShowDeleteConfirm(false);
          }
        }}
      />
    </>
  );
}
