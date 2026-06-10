import { View, ViewProps } from 'react-native';

import { cn } from '@/lib/cn';

type CardProps = ViewProps & {
  className?: string;
  dense?: boolean;
};

export function Card({ className, dense = false, children, ...props }: CardProps) {
  return (
    <View
      className={cn(
        'rounded-card border border-border bg-surface shadow-panel dark:border-border-dark dark:bg-surface-dark',
        dense ? 'p-2' : 'p-3',
        className,
      )}
      {...props}>
      {children}
    </View>
  );
}
