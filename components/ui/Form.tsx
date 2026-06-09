import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';

type OptionSelectProps = {
  label?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function OptionSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select...',
  className,
}: OptionSelectProps) {
  return (
    <View className={className}>
      {label ? (
        <Text variant="label" className="mb-2">
          {label}
        </Text>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
        {options.map((option) => {
          const selected = option === value;

          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              className={cn(
                'rounded-button border px-3 py-2',
                selected
                  ? 'border-brand bg-brand/10 dark:border-brand-dark'
                  : 'border-border dark:border-border-dark',
              )}>
              <Text className={selected ? 'font-medium text-brand dark:text-brand-dark' : ''}>
                {option || placeholder}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

type FormFieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function FormField({ label, children, className }: FormFieldProps) {
  return (
    <View className={className}>
      <Text variant="label" className="mb-2">
        {label}
      </Text>
      {children}
    </View>
  );
}

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <View className="w-full max-w-md rounded-card border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
          <Text className="mb-2 text-lg font-semibold">{title}</Text>
          <Text variant="bodySecondary" className="mb-5">
            {message}
          </Text>
          <View className="flex-row gap-3">
            <Button label="Cancel" variant="ghost" onPress={onCancel} className="flex-1" />
            <Button label={confirmLabel} onPress={onConfirm} className="flex-1" />
          </View>
        </View>
      </View>
    </Modal>
  );
}
