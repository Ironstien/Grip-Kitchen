import { ScrollView, View } from 'react-native';

import { DetailEmptyState } from '@/components/layout/DetailPaneHeader';
import { MasterDetailLayout } from '@/components/layout/MasterDetailLayout';
import { MasterListEmpty, MasterListPane } from '@/components/layout/MasterListPane';
import { EmptyState } from '@/components/ui';
import { Heading, Text } from '@/components/ui/Text';
import { pageHeaderMarginClass, pagePaddingClass } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

type ScreenPlaceholderProps = {
  title: string;
  description: string;
  actionLabel: string;
};

export function ScreenPlaceholder({ title, description, actionLabel }: ScreenPlaceholderProps) {
  const { isDesktop } = useResponsive();

  if (isDesktop) {
    return (
      <MasterDetailLayout
        master={
          <MasterListPane title={title}>
            <MasterListEmpty message="No items yet." />
          </MasterListPane>
        }>
        <DetailEmptyState
          title={`${title} coming soon`}
          description="This screen is scaffolded for Phase 1. Functionality arrives in later phases."
        />
      </MasterDetailLayout>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-surface dark:bg-surface-dark"
      contentContainerClassName={`flex-grow ${pagePaddingClass(false)}`}>
      <View className={pageHeaderMarginClass(false)}>
        <Heading level={2}>{title}</Heading>
        <Text variant="caption" className="mt-0.5">
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
