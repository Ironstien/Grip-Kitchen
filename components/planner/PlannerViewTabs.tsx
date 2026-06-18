import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';

export type PlannerViewMode = 'week' | 'month' | 'agenda';

type PlannerViewTabsProps = {
  value: PlannerViewMode;
  onChange: (mode: PlannerViewMode) => void;
  compact?: boolean;
};

const MODES: { id: PlannerViewMode; label: string }[] = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'agenda', label: 'Agenda' },
];

export function PlannerViewTabs({ value, onChange, compact = false }: PlannerViewTabsProps) {
  return (
    <View
      className={cn(
        'flex-row rounded-button border border-border bg-field p-0.5 dark:border-border-dark dark:bg-field-dark',
        compact && 'shrink-0',
      )}>
      {MODES.map((mode) => {
        const active = value === mode.id;
        return (
          <Pressable
            key={mode.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(mode.id)}
            className={cn(
              'items-center rounded-button px-2.5 py-1.5',
              !compact && 'flex-1',
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
