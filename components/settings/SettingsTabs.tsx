import { Pressable, ScrollView, View } from 'react-native';

import { MasterListPane } from '@/components/layout/MasterListPane';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/contexts/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/cn';

export type SettingsTab = 'general' | 'categories' | 'units' | 'locations';

type SettingsTabsProps = {
  activeTab: SettingsTab;
  onChange: (tab: SettingsTab) => void;
};

const TABS: Array<{ id: SettingsTab; label: string; description?: string }> = [
  { id: 'general', label: 'General', description: 'Account & appearance' },
  { id: 'categories', label: 'Master Category List', description: 'Group ingredients' },
  { id: 'units', label: 'Master Units List', description: 'Units & conversions' },
  { id: 'locations', label: 'Locations', description: 'Storage locations' },
];

export function SettingsTabs({ activeTab, onChange }: SettingsTabsProps) {
  const { isDesktop } = useResponsive();
  const { palette } = useTheme();

  if (isDesktop) {
    return (
      <MasterListPane title="Settings">
        <ScrollView className="flex-1">
          {TABS.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => onChange(tab.id)}
                className="border-b border-border px-3 py-2.5 dark:border-border-dark"
                style={{
                  backgroundColor: selected ? palette.masterListSelected : palette.masterList,
                  borderLeftWidth: selected ? 3 : 0,
                  borderLeftColor: selected ? palette.brand : 'transparent',
                }}>
                <Text className="text-sm font-semibold text-text dark:text-text-dark">{tab.label}</Text>
                {tab.description ? (
                  <Text variant="caption" className="mt-0.5">
                    {tab.description}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </MasterListPane>
    );
  }

  const tabs = TABS.map((tab) => (
    <Pressable
      key={tab.id}
      onPress={() => onChange(tab.id)}
      className={cn(
        'rounded-full border px-3 py-1.5',
        activeTab === tab.id
          ? 'border-brand bg-brand/10 dark:border-brand-dark'
          : 'border-border bg-surface-secondary dark:border-border-dark dark:bg-surface-dark-secondary',
      )}>
      <Text
        className={cn(
          'text-sm',
          activeTab === tab.id
            ? 'font-semibold text-brand dark:text-brand-dark'
            : 'text-text-secondary dark:text-text-dark-secondary',
        )}>
        {tab.label}
      </Text>
    </Pressable>
  ));

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
      <View className="flex-row gap-2">{tabs}</View>
    </ScrollView>
  );
}
