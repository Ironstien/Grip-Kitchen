import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';

type SelectProps = {
  label?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function Select({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select...',
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (option: string) => {
    onChange(option);
    setOpen(false);
  };

  return (
    <View className={className}>
      {label ? (
        <Text variant="label" className="mb-1">
          {label}
        </Text>
      ) : null}
      <Pressable
        onPress={() => setOpen(true)}
        className="min-h-[32px] flex-row items-center justify-between rounded border border-border bg-surface px-2 py-1 dark:border-border-dark dark:bg-surface-dark-secondary">
        <Text
          className={cn('flex-1 text-sm', !value && 'text-text-secondary dark:text-text-dark-secondary')}
          numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Text variant="caption" className="ml-1 text-xs">
          ▼
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="absolute inset-0" onPress={() => setOpen(false)} />
          <View className="max-h-[70%] rounded-t-card border border-border bg-surface p-3 dark:border-border-dark dark:bg-surface-dark">
            {label ? <Text className="mb-3 font-semibold">{label}</Text> : null}
            <ScrollView keyboardShouldPersistTaps="handled">
              {options.map((option) => {
                const selected = option === value;

                return (
                  <Pressable
                    key={option}
                    onPress={() => handleSelect(option)}
                    className={cn(
                      'mb-1 rounded border px-2 py-2',
                      selected
                        ? 'border-brand bg-brand/10 dark:border-brand-dark'
                        : 'border-border dark:border-border-dark',
                    )}>
                    <Text className={cn('text-sm', selected && 'font-medium text-brand dark:text-brand-dark')}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable onPress={() => setOpen(false)} className="mt-1 py-2">
              <Text className="text-center text-sm text-brand dark:text-brand-dark">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
