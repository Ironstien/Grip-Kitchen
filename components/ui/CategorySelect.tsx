import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useUserCategories } from '@/hooks/useUserCategories';
import { cn } from '@/lib/cn';
import { fieldSurfaceClassName } from '@/lib/fieldStyles';
import type { UserCategory } from '@/types/database';

type CategorySelectProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  categories?: UserCategory[];
  placeholder?: string;
  compact?: boolean;
};

export function CategorySelect({
  label,
  value,
  onChange,
  className,
  categories: categoriesProp,
  placeholder = 'Select category',
  compact = true,
}: CategorySelectProps) {
  const { data: fetchedCategories = [], isLoading } = useUserCategories();
  const [open, setOpen] = useState(false);

  const categories = useMemo(() => {
    const source = categoriesProp ?? fetchedCategories ?? [];
    if (value && !source.some((category) => category.name === value)) {
      return [
        {
          id: `legacy-${value}`,
          user_id: '',
          name: value,
          sort_order: -1,
          is_system: true,
        },
        ...source,
      ];
    }
    return source;
  }, [categoriesProp, fetchedCategories, value]);

  const selected = categories.find((category) => category.name === value);

  const handleSelect = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  return (
    <View className={className}>
      {label && (
        <Text variant="label" className="mb-2">
          {label}
        </Text>
      )}
      <Pressable
        onPress={() => setOpen(true)}
        disabled={categories.length === 0}
        className={cn(
          'flex-row items-center justify-between min-h-[32px] px-2 py-1',
          fieldSurfaceClassName,
          categories.length === 0 && 'opacity-60',
        )}>
        <Text
          className={cn(
            compact ? 'text-sm' : '',
            selected ? '' : 'text-text-secondary dark:text-text-dark-secondary',
          )}>
          {isLoading
            ? 'Loading categories...'
            : categories.length === 0
              ? 'No categories in Master Category List'
              : (selected?.name ?? placeholder)}
        </Text>
        <Text variant="caption" className={compact ? 'text-xs' : ''}>
          ▼
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="absolute inset-0" onPress={() => setOpen(false)} />
          <View className="max-h-[70%] rounded-t-card border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark">
            <Text className="mb-4 text-lg font-semibold">Master Category List</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              {categories.map((category) => {
                const isSelected = category.name === value;
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => handleSelect(category.name)}
                    className={cn(
                      'mb-2 rounded-button border px-3 py-3',
                      isSelected
                        ? 'border-brand bg-brand/10 dark:border-brand-dark'
                        : 'border-border dark:border-border-dark',
                    )}>
                    <Text className={isSelected ? 'font-medium text-brand dark:text-brand-dark' : ''}>
                      {category.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable onPress={() => setOpen(false)} className="mt-2 py-3">
              <Text className="text-center text-brand dark:text-brand-dark">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
