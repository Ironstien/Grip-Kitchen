import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { RecipeIngredientList } from '@/components/recipes/RecipeIngredientList';
import { FormField, OptionSelect } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { DIETARY_TAG_PRESETS } from '@/constants/recipes';
import { useIngredients } from '@/hooks/useIngredients';
import { useRecipeMutations, useRecipeScaling } from '@/hooks/useRecipes';
import type { RecipeWithIngredients } from '@/lib/services/recipes';

type DraftIngredient = {
  ingredient_id: string;
  required_quantity: string;
};

type RecipeFormProps = {
  recipe?: RecipeWithIngredients | null;
  onSaved: (recipeId: string) => void;
  onCancel: () => void;
};

export function RecipeForm({ recipe, onSaved, onCancel }: RecipeFormProps) {
  const { data: ingredientsCatalog = [] } = useIngredients();
  const { create, update, uploadHeroImage } = useRecipeMutations();

  const [title, setTitle] = useState(recipe?.title ?? '');
  const [instructions, setInstructions] = useState(recipe?.instructions ?? '');
  const [baseServings, setBaseServings] = useState(String(recipe?.base_serving_size ?? 4));
  const [timeToCook, setTimeToCook] = useState(
    recipe?.time_to_cook != null ? String(recipe.time_to_cook) : '',
  );
  const [heroImageUrl, setHeroImageUrl] = useState(recipe?.hero_image_url ?? '');
  const [selectedTags, setSelectedTags] = useState<string[]>(recipe?.dietary_tags ?? []);
  const [customTag, setCustomTag] = useState('');
  const [ingredients, setIngredients] = useState<DraftIngredient[]>(
    recipe?.recipe_ingredients.map((ingredient) => ({
      ingredient_id: ingredient.ingredient_id,
      required_quantity: String(ingredient.required_quantity),
    })) ?? [{ ingredient_id: ingredientsCatalog[0]?.id ?? '', required_quantity: '1' }],
  );
  const [isSaving, setIsSaving] = useState(false);

  const ingredientOptions = useMemo(
    () => ingredientsCatalog.map((item) => ({ id: item.id, label: item.name })),
    [ingredientsCatalog],
  );

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
      recipe_ingredients: ingredients
        .filter((entry) => entry.ingredient_id)
        .map((entry, index) => {
          const catalogItem = ingredientsCatalog.find((item) => item.id === entry.ingredient_id);

          return {
            id: recipe?.recipe_ingredients[index]?.id ?? `draft-${index}`,
            recipe_id: recipe?.id ?? 'draft',
            ingredient_id: entry.ingredient_id,
            required_quantity: Number(entry.required_quantity) || 0,
            ingredient: catalogItem
              ? {
                  id: catalogItem.id,
                  name: catalogItem.name,
                  unit_of_measure: catalogItem.unit_of_measure,
                  price_per_unit: catalogItem.price_per_unit,
                  price_unit_of_measure: catalogItem.price_unit_of_measure,
                  category: catalogItem.category,
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

  const toggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((entry) => entry !== tag) : [...current, tag],
    );
  };

  const addCustomTag = () => {
    const trimmed = customTag.trim();
    if (!trimmed || selectedTags.includes(trimmed)) {
      return;
    }

    setSelectedTags((current) => [...current, trimmed]);
    setCustomTag('');
  };

  const addIngredientRow = () => {
    setIngredients((current) => [
      ...current,
      { ingredient_id: ingredientsCatalog[0]?.id ?? '', required_quantity: '1' },
    ]);
  };

  const updateIngredient = (index: number, patch: Partial<DraftIngredient>) => {
    setIngredients((current) =>
      current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, ...patch } : entry)),
    );
  };

  const removeIngredient = (index: number) => {
    setIngredients((current) => current.filter((_, entryIndex) => entryIndex !== index));
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload a hero image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setHeroImageUrl(result.assets[0].uri);
    }
  };

  const validate = (): Array<{ ingredient_id: string; required_quantity: number }> | null => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Enter a recipe title.');
      return null;
    }

    const parsedBaseServings = Number(baseServings);
    if (Number.isNaN(parsedBaseServings) || parsedBaseServings <= 0) {
      Alert.alert('Invalid servings', 'Base serving size must be greater than zero.');
      return null;
    }

    const parsedIngredients = ingredients
      .filter((entry) => entry.ingredient_id)
      .map((entry) => ({
        ingredient_id: entry.ingredient_id,
        required_quantity: Number(entry.required_quantity),
      }));

    if (parsedIngredients.some((entry) => Number.isNaN(entry.required_quantity) || entry.required_quantity <= 0)) {
      Alert.alert('Invalid ingredients', 'Each ingredient needs a quantity greater than zero.');
      return null;
    }

    return parsedIngredients;
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
      hero_image_url: heroImageUrl.startsWith('http') ? heroImageUrl : recipe?.hero_image_url ?? null,
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

      if (heroImageUrl && !heroImageUrl.startsWith('http')) {
        const publicUrl = await uploadHeroImage.mutateAsync({
          recipeId: savedRecipeId,
          uri: heroImageUrl,
        });
        await update.mutateAsync({
          id: savedRecipeId,
          input: { hero_image_url: publicUrl },
        });
      } else if (heroImageUrl.startsWith('http')) {
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

  return (
    <ScrollView contentContainerClassName="gap-5 pb-12" keyboardShouldPersistTaps="handled">
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

      <FormField label="Hero photo">
        {heroImageUrl ? (
          <Image source={{ uri: heroImageUrl }} style={{ width: '100%', height: 220, borderRadius: 10 }} contentFit="cover" />
        ) : (
          <View className="h-[220px] items-center justify-center rounded-card border border-dashed border-border dark:border-border-dark">
            <Text variant="bodySecondary">Photo required for recipe cards</Text>
          </View>
        )}
        <Button label="Upload photo" variant="secondary" onPress={() => void pickImage()} className="mt-3 self-start" />
        <Input
          value={heroImageUrl.startsWith('http') ? heroImageUrl : ''}
          onChangeText={setHeroImageUrl}
          placeholder="Paste image URL"
          className="mt-3"
        />
      </FormField>

      <View>
        <Text variant="label" className="mb-2">
          Dietary tags
        </Text>
        <View className="mb-3 flex-row flex-wrap gap-2">
          {DIETARY_TAG_PRESETS.map((tag) => (
            <Pressable key={tag} onPress={() => toggleTag(tag)}>
              <Text className={selectedTags.includes(tag) ? 'font-semibold text-brand dark:text-brand-dark' : ''}>
                {selectedTags.includes(tag) ? '• ' : ''}{tag}
              </Text>
            </Pressable>
          ))}
        </View>
        <View className="flex-row gap-3">
          <Input value={customTag} onChangeText={setCustomTag} placeholder="Custom tag" className="flex-1" />
          <Button label="Add tag" variant="secondary" onPress={addCustomTag} />
        </View>
      </View>

      <View className="gap-3">
        <Text variant="label">Ingredients</Text>
        {ingredients.map((entry, index) => (
          <View key={`${entry.ingredient_id}-${index}`} className="gap-2 rounded-card border border-border p-3 dark:border-border-dark">
            <OptionSelect
              label="Ingredient"
              value={ingredientOptions.find((option) => option.id === entry.ingredient_id)?.label ?? ''}
              options={ingredientOptions.map((option) => option.label)}
              onChange={(label) => {
                const match = ingredientOptions.find((option) => option.label === label);
                if (match) {
                  updateIngredient(index, { ingredient_id: match.id });
                }
              }}
            />
            <FormField label="Required quantity">
              <Input
                value={entry.required_quantity}
                onChangeText={(value) => updateIngredient(index, { required_quantity: value })}
                keyboardType="decimal-pad"
              />
            </FormField>
            <Button label="Remove ingredient" variant="ghost" onPress={() => removeIngredient(index)} />
          </View>
        ))}
        <Button label="Add ingredient" variant="secondary" onPress={addIngredientRow} />
      </View>

      <FormField label="Instructions">
        <Input
          value={instructions}
          onChangeText={setInstructions}
          placeholder="Step-by-step instructions"
          multiline
          className="min-h-[160px] align-top"
        />
      </FormField>

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

      <View className="flex-row gap-3">
        <Button label="Cancel" variant="ghost" onPress={onCancel} className="flex-1" />
        <Button
          label={isSaving ? 'Saving...' : recipe ? 'Save recipe' : 'Create recipe'}
          onPress={() => void handleSave()}
          disabled={isSaving}
          className="flex-1"
        />
      </View>
    </ScrollView>
  );
}
