import { Pressable, PressableProps, Text } from 'react-native';

import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'ghost' | 'secondary';

type ButtonProps = PressableProps & {
  label: string;
  variant?: ButtonVariant;
  className?: string;
  textClassName?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand dark:bg-brand-dark',
  ghost: 'bg-transparent border border-border dark:border-border-dark',
  secondary: 'bg-surface-secondary dark:bg-surface-dark-secondary',
};

const textVariantClasses: Record<ButtonVariant, string> = {
  primary: 'text-white font-semibold',
  ghost: 'text-text dark:text-text-dark font-medium',
  secondary: 'text-text dark:text-text-dark font-medium',
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
        'min-h-[48px] items-center justify-center rounded-button px-5 py-3 active:opacity-80',
        variantClasses[variant],
        disabled && 'opacity-50',
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
