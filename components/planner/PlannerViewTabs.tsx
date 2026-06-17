import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';

export type PlannerViewMode = 'week' | 'month' | 'agenda';

type PlannerViewTabsProps = {
  value: PlannerViewMode;
  onChange: (mode: PlannerViewMode) => void;
};

const MODES: { id: PlannerViewMode; label: string }[] = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'agenda', label: 'Agenda' },
];

export function PlannerViewTabs({ value, onChange }: PlannerViewTabsProps) {
  return (
    <View className="flex-row rounded-button border border-border bg-field p-0.5 dark:border-border-dark dark:bg-field-dark">
      {MODES.map((mode) => {
        const active = value === mode.id;
        return (
          <Pressable
            key={mode.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(mode.id)}
            className={cn(
              'flex-1 items-center rounded-button px-2 py-1.5',
              active && 'bg-surface shadow-field dark:bg-surface-dark',
            )}>
            <Text
              className={cn(
                'text-xs font-medium',
                active ? 'text-text dark:text-text-dark' : 'text-text-secondary dark:text-text-dark-secondary',
              )}>
              {mode.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
