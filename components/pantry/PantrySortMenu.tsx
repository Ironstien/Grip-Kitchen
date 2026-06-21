import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FieldDropdownPanel, useFieldDropdown } from '@/components/ui/FieldDropdown';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/contexts/ThemeContext';
import {
  PANTRY_SORT_LABELS,
  type PantrySortMode,
} from '@/lib/inventory/sortPantryItems';
import { cn } from '@/lib/cn';

type PantrySortMenuProps = {
  value: PantrySortMode;
  onChange: (mode: PantrySortMode) => void;
  className?: string;
};

const SORT_MODES: PantrySortMode[] = ['shelf', 'category', 'alpha'];

export function PantrySortMenu({ value, onChange, className }: PantrySortMenuProps) {
  const { palette } = useTheme();
  const { anchorRef, open, anchor, openDropdown, close } = useFieldDropdown({ minWidth: 180 });

  return (
    <>
      <View ref={anchorRef} collapsable={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sort by ${PANTRY_SORT_LABELS[value]}`}
          onPress={openDropdown}
          className={cn(
            'h-8 flex-row items-center gap-1 rounded-button border border-border px-2.5 active:opacity-70 dark:border-border-dark',
            className,
          )}>
          <Ionicons name="swap-vertical-outline" size={16} color={palette.textSecondary} />
          <Text variant="caption" className="font-medium">
            {PANTRY_SORT_LABELS[value]}
          </Text>
        </Pressable>
      </View>

      <FieldDropdownPanel visible={open} anchor={anchor} onClose={close} minWidth={180}>
        {SORT_MODES.map((mode) => {
          const selected = mode === value;

          return (
            <Pressable
              key={mode}
              onPress={() => {
                onChange(mode);
                close();
              }}
              className={cn(
                'border-b border-border px-2 py-2 dark:border-border-dark',
                selected && 'bg-brand/10 dark:bg-brand-dark/10',
              )}>
              <Text className={cn('text-sm', selected && 'font-medium text-brand dark:text-brand-dark')}>
                {PANTRY_SORT_LABELS[mode]}
              </Text>
            </Pressable>
          );
        })}
      </FieldDropdownPanel>
    </>
  );
}

export function PantryHeaderActions({
  sortMode,
  onSortChange,
}: {
  sortMode: PantrySortMode;
  onSortChange: (mode: PantrySortMode) => void;
}) {
  return (
    <View className="flex-row items-center">
      <PantrySortMenu value={sortMode} onChange={onSortChange} />
    </View>
  );
}
