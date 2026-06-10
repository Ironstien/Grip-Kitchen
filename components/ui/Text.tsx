import { Text as RNText, TextProps as RNTextProps } from 'react-native';

import { cn } from '@/lib/cn';

type TextVariant = 'body' | 'bodySecondary' | 'caption' | 'label';

type TextProps = RNTextProps & {
  variant?: TextVariant;
  className?: string;
};

const variantClasses: Record<TextVariant, string> = {
  body: 'text-sm text-text dark:text-text-dark',
  bodySecondary: 'text-sm text-text-secondary dark:text-text-dark-secondary',
  caption: 'text-xs text-text-muted dark:text-text-dark-secondary',
  label: 'text-xs font-medium text-text dark:text-text-dark',
};

export function Text({ variant = 'body', className, ...props }: TextProps) {
  return <RNText className={cn(variantClasses[variant], className)} {...props} />;
}

type HeadingProps = RNTextProps & {
  level?: 1 | 2 | 3;
  className?: string;
};

const headingClasses: Record<1 | 2 | 3, string> = {
  1: 'text-xl font-bold text-text dark:text-text-dark',
  2: 'text-lg font-semibold text-text dark:text-text-dark',
  3: 'text-base font-semibold text-text dark:text-text-dark',
};

export function Heading({ level = 1, className, ...props }: HeadingProps) {
  return <RNText className={cn(headingClasses[level], className)} {...props} />;
}
