import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';

type BadgeStatus = 'success' | 'warning' | 'danger' | 'neutral';

type BadgeProps = {
  label: string;
  status?: BadgeStatus;
  className?: string;
};

const statusClasses: Record<BadgeStatus, string> = {
  success: 'bg-status-success/10 border-status-success/30',
  warning: 'bg-status-warning/10 border-status-warning/30',
  danger: 'bg-status-danger/10 border-status-danger/30',
  neutral: 'bg-surface-secondary border-border dark:bg-surface-dark-secondary dark:border-border-dark',
};

const textClasses: Record<BadgeStatus, string> = {
  success: 'text-status-success',
  warning: 'text-status-warning',
  danger: 'text-status-danger',
  neutral: 'text-text-secondary dark:text-text-dark-secondary',
};

export function Badge({ label, status = 'neutral', className }: BadgeProps) {
  return (
    <View
      className={cn(
        'self-start rounded-full border px-2.5 py-1',
        statusClasses[status],
        className,
      )}>
      <Text className={cn('text-xs font-medium', textClasses[status])}>{label}</Text>
    </View>
  );
}
