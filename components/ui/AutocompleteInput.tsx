import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';

export type AutocompleteOption = {
  id: string;
  label: string;
  keywords?: string;
};

type AutocompleteInputProps = {
  label?: string;
  value: string;
  options: AutocompleteOption[];
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
};

const MAX_RESULTS = 20;

export function AutocompleteInput({
  label,
  value,
  options,
  onChange,
  placeholder = 'Search...',
  className,
}: AutocompleteInputProps) {
  const selected = options.find((option) => option.id === value);
  const [query, setQuery] = useState(selected?.label ?? '');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery(selected?.label ?? '');
    }
  }, [isOpen, selected?.label]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [...options].sort((a, b) => a.label.localeCompare(b.label)).slice(0, MAX_RESULTS);
    }

    return options
      .filter(
        (option) =>
          option.label.toLowerCase().includes(normalizedQuery) ||
          option.keywords?.includes(normalizedQuery),
      )
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(0, MAX_RESULTS);
  }, [options, query]);

  const handleSelect = (option: AutocompleteOption) => {
    onChange(option.id);
    setQuery(option.label);
    setIsOpen(false);
  };

  return (
    <View className={cn('gap-1', className)}>
      {label ? (
        <Text variant="label" className="mb-0">
          {label}
        </Text>
      ) : null}
      <Input
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          setIsOpen(true);
          if (value && text !== selected?.label) {
            onChange('');
          }
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setTimeout(() => setIsOpen(false), 150);
        }}
        placeholder={placeholder}
      />
      {isOpen && filteredOptions.length > 0 ? (
        <View className="max-h-40 rounded border border-border bg-surface dark:border-border-dark dark:bg-surface-dark">
          <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled>
            {filteredOptions.map((option) => {
              const isSelected = option.id === value;

              return (
                <Pressable
                  key={option.id}
                  onPress={() => handleSelect(option)}
                  className={cn(
                    'border-b border-border px-2 py-1.5 dark:border-border-dark',
                    isSelected && 'bg-brand/10 dark:bg-brand-dark/10',
                  )}>
                  <Text className={cn('text-sm', isSelected && 'font-medium text-brand dark:text-brand-dark')}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : isOpen && query.trim().length > 0 ? (
        <View className="rounded border border-border bg-surface px-2 py-1.5 dark:border-border-dark dark:bg-surface-dark">
          <Text variant="caption">No matching ingredients</Text>
        </View>
      ) : null}
    </View>
  );
}
