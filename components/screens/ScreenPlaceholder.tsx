import { ScrollView, View } from 'react-native';

import { EmptyState } from '@/components/ui';
import { Heading, Text } from '@/components/ui/Text';
import { useResponsive } from '@/hooks/useResponsive';

type ScreenPlaceholderProps = {
  title: string;
  description: string;
  actionLabel: string;
};

export function ScreenPlaceholder({ title, description, actionLabel }: ScreenPlaceholderProps) {
  const { isDesktop } = useResponsive();

  return (
    <ScrollView
      className="flex-1 bg-surface dark:bg-surface-dark"
      contentContainerClassName={`flex-grow ${isDesktop ? 'px-8 py-6' : 'px-5 py-5'}`}>
      <View className={isDesktop ? 'mb-4' : 'mb-6'}>
        <Heading level={isDesktop ? 1 : 2}>{title}</Heading>
        <Text variant="bodySecondary" className="mt-1">
          {description}
        </Text>
      </View>
      <EmptyState
        title={`${title} coming soon`}
        description="This screen is scaffolded for Phase 1. Functionality arrives in later phases."
        actionLabel={actionLabel}
        onAction={() => undefined}
      />
    </ScrollView>
  );
}
