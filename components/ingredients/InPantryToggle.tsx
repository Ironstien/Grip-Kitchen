import { ActivityIndicator, Pressable } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';

type InPantryToggleProps = {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
  compact?: boolean;
};

export function InPantryToggle({
  enabled,
  onToggle,
  disabled = false,
  compact = false,
}: InPantryToggleProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled, disabled }}
      accessibilityLabel={enabled ? 'In pantry, tap to remove' : 'Not in pantry, tap to add'}
      disabled={disabled}
      onPress={() => onToggle(!enabled)}
      className={cn(
        'items-center justify-center rounded-button border active:opacity-80',
        compact ? 'min-h-[28px] px-2 py-1' : 'min-h-[32px] px-2.5 py-1.5',
        enabled
          ? 'border-brand bg-brand/10 dark:border-brand-dark'
          : 'border-border bg-field dark:border-border-dark dark:bg-field-dark',
        disabled && 'opacity-60',
      )}>
      {disabled ? (
        <ActivityIndicator size="small" />
      ) : (
        <Text
          className={cn(
            'font-medium',
            compact ? 'text-[11px]' : 'text-xs',
            enabled ? 'text-brand dark:text-brand-dark' : 'text-text-secondary dark:text-text-dark-secondary',
          )}>
          {enabled ? 'In pantry' : 'Not in pantry'}
        </Text>
      )}
    </Pressable>
  );
}
