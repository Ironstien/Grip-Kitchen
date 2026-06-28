import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';

export type FinanceTab = 'overview' | 'expenses';

type FinanceTabsProps = {
  activeTab: FinanceTab;
  onChange: (tab: FinanceTab) => void;
};

const TABS: Array<{ id: FinanceTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'expenses', label: 'Expenses' },
];

export function FinanceTabs({ activeTab, onChange }: FinanceTabsProps) {
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
      <View className="flex-row gap-2">{tabs}</View>
    </ScrollView>
  );
}
