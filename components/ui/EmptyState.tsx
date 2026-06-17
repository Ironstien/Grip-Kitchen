import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <View className={cn('flex-1 items-center justify-center px-4 py-8', className)}>
      <Text className="mb-1 text-center text-base font-semibold text-text dark:text-text-dark">
        {title}
      </Text>
      <Text variant="bodySecondary" className="mb-4 max-w-sm text-center">
        {description}
      </Text>
      {actionLabel ? (
        <Button label={actionLabel} onPress={onAction} className="min-w-[140px]" />
      ) : null}
    </View>
  );
}
