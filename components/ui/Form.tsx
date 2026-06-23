import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';
import { fieldSurfaceClassName } from '@/lib/fieldStyles';

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
        <Text variant="label" className="mb-1">
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
                fieldSurfaceClassName,
                'px-2 py-1',
                selected
                  ? 'border-brand bg-brand/10 dark:border-brand-dark'
                  : '',
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
      <Text variant="label" className="mb-1">
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
        <View className="w-full max-w-md rounded-card border border-border bg-surface p-3 dark:border-border-dark dark:bg-surface-dark">
          <Text className="mb-1 text-base font-semibold">{title}</Text>
          <Text variant="bodySecondary" className="mb-3">
            {message}
          </Text>
          <View className="flex-row gap-2">
            <Button label="Cancel" variant="ghost" onPress={onCancel} className="flex-1" />
            <Button label={confirmLabel} onPress={onConfirm} className="flex-1" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

type PromptModalProps = {
  visible: boolean;
  title: string;
  message?: string;
  label?: string;
  initialValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
};

export function PromptModal({
  visible,
  title,
  message,
  label,
  initialValue = '',
  placeholder,
  confirmLabel = 'Save',
  onConfirm,
  onCancel,
  isSubmitting = false,
}: PromptModalProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
    }
  }, [initialValue, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <View className="w-full max-w-md rounded-card border border-border bg-surface p-3 dark:border-border-dark dark:bg-surface-dark">
          <Text className="mb-1 text-base font-semibold">{title}</Text>
          {message ? (
            <Text variant="bodySecondary" className="mb-3">
              {message}
            </Text>
          ) : null}
          {label ? (
            <Text variant="label" className="mb-1">
              {label}
            </Text>
          ) : null}
          <Input
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            autoFocus
            editable={!isSubmitting}
            onSubmitEditing={() => {
              if (value.trim() && !isSubmitting) {
                onConfirm(value);
              }
            }}
          />
          <View className="mt-3 flex-row gap-2">
            <Button
              label="Cancel"
              variant="ghost"
              onPress={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            />
            <Button
              label={isSubmitting ? 'Saving...' : confirmLabel}
              onPress={() => onConfirm(value)}
              disabled={!value.trim() || isSubmitting}
              className="flex-1"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
