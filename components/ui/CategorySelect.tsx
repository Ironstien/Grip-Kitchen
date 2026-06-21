import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { FieldDropdownPanel, useFieldDropdown } from '@/components/ui/FieldDropdown';
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
  const { anchorRef, open, anchor, openDropdown, close } = useFieldDropdown({ minWidth: 220 });

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
    close();
  };

  return (
    <View ref={anchorRef} collapsable={false} className={className}>
      {label && (
        <Text variant="label" className="mb-2">
          {label}
        </Text>
      )}
      <Pressable
        onPress={() => categories.length > 0 && openDropdown()}
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

      <FieldDropdownPanel visible={open} anchor={anchor} onClose={close} minWidth={220} maxHeight={360}>
        <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
          {categories.map((category) => {
            const isSelected = category.name === value;
            return (
              <Pressable
                key={category.id}
                onPress={() => handleSelect(category.name)}
                className={cn(
                  'border-b border-border px-2 py-2 dark:border-border-dark',
                  isSelected && 'bg-brand/10 dark:bg-brand-dark/10',
                )}>
                <Text className={cn('text-sm', isSelected && 'font-medium text-brand dark:text-brand-dark')}>
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </FieldDropdownPanel>
    </View>
  );
}
