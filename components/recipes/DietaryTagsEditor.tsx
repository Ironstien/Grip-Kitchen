import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { mergeDietaryTags, useAllDietaryTags } from '@/hooks/useAllDietaryTags';
import { fieldPanelClassName, fieldSurfaceClassName } from '@/lib/fieldStyles';
import { cn } from '@/lib/cn';

type DietaryTagsEditorProps = {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
};

export function DietaryTagsEditor({ selectedTags, onChange }: DietaryTagsEditorProps) {
  const { tags: usedTags } = useAllDietaryTags();
  const [customTag, setCustomTag] = useState('');

  const suggestedTags = useMemo(
    () => mergeDietaryTags(usedTags, selectedTags),
    [usedTags, selectedTags],
  );

  const unselectedSuggestions = suggestedTags.filter((tag) => !selectedTags.includes(tag));

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) {
      return;
    }

    if (selectedTags.includes(trimmed)) {
      return;
    }

    onChange([...selectedTags, trimmed]);
  };

  const removeTag = (tag: string) => {
    onChange(selectedTags.filter((entry) => entry !== tag));
  };

  const addCustomTag = () => {
    const trimmed = customTag.trim();
    if (!trimmed) {
      return;
    }

    if (selectedTags.includes(trimmed)) {
      Alert.alert('Tag already added', `"${trimmed}" is already on this recipe.`);
      return;
    }

    addTag(trimmed);
    setCustomTag('');
  };

  return (
    <View className={fieldPanelClassName}>
      <Text variant="label" className="mb-2">
        Dietary tags
      </Text>

      {selectedTags.length > 0 ? (
        <View className="mb-3">
          <Text variant="caption" className="mb-1.5">
            Applied tags
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {selectedTags.map((tag) => (
              <View
                key={tag}
                className={cn(
                  fieldSurfaceClassName,
                  'flex-row items-center gap-1 border-brand bg-brand/10 px-2 py-1 dark:border-brand-dark',
                )}>
                <Text className="text-sm font-semibold text-brand dark:text-brand-dark">{tag}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${tag}`}
                  onPress={() => removeTag(tag)}
                  hitSlop={6}
                  className="p-0.5">
                  <Ionicons name="close-circle" size={18} color="#DC2626" />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <Text variant="caption" className="mb-3">
          No tags applied yet.
        </Text>
      )}

      {unselectedSuggestions.length > 0 ? (
        <View className="mb-3">
          <Text variant="caption" className="mb-1.5">
            Suggested tags
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {unselectedSuggestions.map((tag) => (
              <Pressable
                key={tag}
                onPress={() => addTag(tag)}
                className={cn(fieldSurfaceClassName, 'px-2 py-1')}>
                <Text className="text-sm text-text-secondary dark:text-text-dark-secondary">
                  {tag}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : usedTags.length === 0 && selectedTags.length === 0 ? (
        <Text variant="caption" className="mb-3">
          Add a custom tag to start building your suggested list.
        </Text>
      ) : null}

      <View className="flex-row gap-2">
        <Input
          value={customTag}
          onChangeText={setCustomTag}
          placeholder="Custom tag"
          className="flex-1"
          onSubmitEditing={addCustomTag}
        />
        <Button label="Add tag" variant="secondary" onPress={addCustomTag} />
      </View>
    </View>
  );
}
