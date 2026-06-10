import { TextInput, TextInputProps } from 'react-native';

import { cn } from '@/lib/cn';
import { fieldSurfaceClassName } from '@/lib/fieldStyles';

type InputProps = TextInputProps & {
  className?: string;
};

export function Input({ className, placeholderTextColor, ...props }: InputProps) {
  return (
    <TextInput
      placeholderTextColor={placeholderTextColor ?? '#999999'}
      className={cn(
        'min-h-[32px] px-2 py-1 text-sm text-text dark:text-text-dark',
        fieldSurfaceClassName,
        className,
      )}
      {...props}
    />
  );
}
