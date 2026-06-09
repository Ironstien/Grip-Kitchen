import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel: string;
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
    <View className={cn('flex-1 items-center justify-center px-6 py-12', className)}>
      <Text className="mb-2 text-center text-xl font-semibold text-text dark:text-text-dark">
        {title}
      </Text>
      <Text
        variant="bodySecondary"
        className="mb-6 max-w-sm text-center">
        {description}
      </Text>
      <Button label={actionLabel} onPress={onAction} className="min-w-[180px]" />
    </View>
  );
}
