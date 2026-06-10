import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/cn';

export type SettingsTab = 'general' | 'master' | 'categories' | 'units' | 'locations';

type SettingsTabsProps = {
  activeTab: SettingsTab;
  onChange: (tab: SettingsTab) => void;
};

const TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'master', label: 'Master Ingredient List' },
  { id: 'categories', label: 'Master Category List' },
  { id: 'units', label: 'Master Units List' },
  { id: 'locations', label: 'Locations' },
];

export function SettingsTabs({ activeTab, onChange }: SettingsTabsProps) {
  const { isDesktop } = useResponsive();

  const tabs = TABS.map((tab) => (
    <Pressable
      key={tab.id}
      onPress={() => onChange(tab.id)}
      className={cn(
        isDesktop ? 'rounded-card px-3 py-2' : 'rounded-full border px-3 py-1.5',
        activeTab === tab.id
          ? isDesktop
            ? 'bg-black/5 dark:bg-white/10'
            : 'border-brand bg-brand/10 dark:border-brand-dark'
          : isDesktop
            ? ''
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

  if (isDesktop) {
    return <View className="mb-3 flex-row flex-wrap gap-0.5">{tabs}</View>;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
      <View className="flex-row gap-2">{tabs}</View>
    </ScrollView>
  );
}
