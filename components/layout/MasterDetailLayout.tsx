import type { ReactNode } from 'react';
import { View } from 'react-native';

import { MASTER_LIST_WIDTH } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type MasterDetailLayoutProps = {
  master: ReactNode;
  children: ReactNode;
};

export function MasterDetailLayout({ master, children }: MasterDetailLayoutProps) {
  const { palette } = useTheme();

  return (
    <View className="flex-1 flex-row bg-surface-secondary dark:bg-surface-dark-secondary">
      <View
        className="h-full shrink-0 border-r border-border dark:border-border-dark"
        style={{ width: MASTER_LIST_WIDTH, backgroundColor: palette.masterList }}>
        {master}
      </View>
      <View className="min-w-0 flex-1 bg-surface dark:bg-surface-dark">{children}</View>
    </View>
  );
}
