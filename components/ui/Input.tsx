import { TextInput, TextInputProps } from 'react-native';

import { cn } from '@/lib/cn';

type InputProps = TextInputProps & {
  className?: string;
};

export function Input({ className, placeholderTextColor, ...props }: InputProps) {
  return (
    <TextInput
      placeholderTextColor={placeholderTextColor ?? '#999999'}
      className={cn(
        'min-h-[32px] rounded-button border border-border bg-surface px-2 py-1 text-sm text-text dark:border-border-dark dark:bg-surface-dark-secondary dark:text-text-dark',
        className,
      )}
      {...props}
    />
  );
}
