import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Heading, Text } from '@/components/ui/Text';
import { detailPaddingClass } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

export type DetailAction = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
};

type DetailPaneHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: DetailAction[];
  actionsPlacement?: 'below' | 'inline';
  toolbar?: ReactNode;
};

export function DetailPaneHeader({
  title,
  subtitle,
  onBack,
  actions = [],
  actionsPlacement = 'below',
  toolbar,
}: DetailPaneHeaderProps) {
  const { isDesktop } = useResponsive();
  const inlineActions = actionsPlacement === 'inline';

  const actionButtons = actions.map((action) => (
    <Button
      key={action.label}
      label={action.label}
      variant={action.variant ?? 'secondary'}
      onPress={action.onPress}
      disabled={action.disabled}
    />
  ));

  return (
    <View className={`border-b border-border dark:border-border-dark ${detailPaddingClass(isDesktop)}`}>
      <View className="flex-row items-start justify-between gap-4">
        <View className="min-w-0 flex-1 flex-row items-start gap-2">
          {!isDesktop && onBack ? (
            <IconButton name="arrow-back" accessibilityLabel="Go back" onPress={onBack} />
          ) : null}
          <View className="min-w-0 flex-1">
            <Heading level={isDesktop ? 1 : 2}>{title}</Heading>
            {subtitle ? (
              <Text variant="caption" className="mt-0.5">
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {inlineActions && actions.length > 0 ? (
          <View className="shrink-0 flex-row flex-wrap items-center justify-end gap-2">
            {actionButtons}
          </View>
        ) : null}
      </View>

      {!inlineActions && (actions.length > 0 || toolbar) ? (
        <View className="mt-3 flex-row flex-wrap items-center gap-2">
          {actionButtons}
          {toolbar}
        </View>
      ) : null}

      {inlineActions && toolbar ? (
        <View className="mt-3 flex-row flex-wrap items-center gap-2">{toolbar}</View>
      ) : null}
    </View>
  );
}

export function DetailEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text className="text-base font-semibold text-text dark:text-text-dark">{title}</Text>
      <Text variant="bodySecondary" className="mt-2 text-center">
        {description}
      </Text>
    </View>
  );
}
