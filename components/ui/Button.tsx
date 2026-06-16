import { Pressable, PressableProps, Text } from 'react-native';

import { cn } from '@/lib/cn';
import { fieldSurfaceClassName } from '@/lib/fieldStyles';

type ButtonVariant = 'primary' | 'ghost' | 'secondary';

type ButtonProps = PressableProps & {
  label: string;
  variant?: ButtonVariant;
  className?: string;
  textClassName?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand shadow-field dark:bg-brand-dark',
  ghost: cn(fieldSurfaceClassName, 'bg-field dark:bg-field-dark'),
  secondary: 'border border-field-border bg-[#E8EAED] shadow-field dark:border-field-dark-border dark:bg-[#333333]',
};

const textVariantClasses: Record<ButtonVariant, string> = {
  primary: 'text-sm text-white font-semibold',
  ghost: 'text-sm text-text dark:text-text-dark font-medium',
  secondary: 'text-sm text-text dark:text-text-dark font-medium',
};

export function Button({
  label,
  variant = 'primary',
  className,
  textClassName,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      className={cn(
        'min-h-[32px] items-center justify-center rounded-button px-3 py-1.5 active:opacity-80',
        variantClasses[variant],
        disabled ? 'opacity-50' : undefined,
        className,
      )}
      {...props}>
      {({ pressed }) => (
        <Text
          className={cn(
            textVariantClasses[variant],
            pressed && 'opacity-80',
            textClassName,
          )}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
