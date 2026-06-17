import { Alert, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

  const openMenu = () => {
    Alert.alert('Sort by', undefined, [
      ...SORT_MODES.map((mode) => ({
        text: PANTRY_SORT_LABELS[mode],
        onPress: () => onChange(mode),
        style: mode === value ? ('default' as const) : ('default' as const),
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Sort by ${PANTRY_SORT_LABELS[value]}`}
      onPress={openMenu}
      className={cn(
        'h-8 flex-row items-center gap-1 rounded-button border border-border px-2.5 active:opacity-70 dark:border-border-dark',
        className,
      )}>
      <Ionicons name="swap-vertical-outline" size={16} color={palette.textSecondary} />
      <Text variant="caption" className="font-medium">
        {PANTRY_SORT_LABELS[value]}
      </Text>
    </Pressable>
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
