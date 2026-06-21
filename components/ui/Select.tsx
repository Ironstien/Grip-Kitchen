import { Pressable, ScrollView, View } from 'react-native';

import { FieldDropdownPanel, useFieldDropdown } from '@/components/ui/FieldDropdown';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';
import { fieldSurfaceClassName } from '@/lib/fieldStyles';

type SelectProps = {
  label?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function Select({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select...',
  className,
  disabled = false,
}: SelectProps) {
  const { anchorRef, open, anchor, openDropdown, close } = useFieldDropdown();

  const handleOpen = () => {
    if (disabled || options.length === 0) {
      return;
    }
    openDropdown();
  };

  const handleSelect = (option: string) => {
    onChange(option);
    close();
  };

  return (
    <View ref={anchorRef} collapsable={false} className={className}>
      {label ? (
        <Text variant="label" className="mb-1">
          {label}
        </Text>
      ) : null}
      <Pressable
        onPress={handleOpen}
        disabled={disabled || options.length === 0}
        className={cn(
          'min-h-[32px] flex-row items-center justify-between px-2 py-1',
          fieldSurfaceClassName,
          (disabled || options.length === 0) && 'opacity-60',
        )}>
        <Text
          className={cn('flex-1 text-sm', !value && 'text-text-secondary dark:text-text-dark-secondary')}
          numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Text variant="caption" className="ml-1 text-xs">
          ▼
        </Text>
      </Pressable>

      <FieldDropdownPanel visible={open} anchor={anchor} onClose={close}>
        <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
          {options.map((option) => {
            const selected = option === value;

            return (
              <Pressable
                key={option}
                onPress={() => handleSelect(option)}
                className={cn(
                  'border-b border-border px-2 py-2 dark:border-border-dark',
                  selected && 'bg-brand/10 dark:bg-brand-dark/10',
                )}>
                <Text className={cn('text-sm', selected && 'font-medium text-brand dark:text-brand-dark')}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </FieldDropdownPanel>
    </View>
  );
}
