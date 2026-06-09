import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/contexts/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/cn';
import type { StorageLocation } from '@/types/database';

type LocationFilterTabsProps = {
  locations: StorageLocation[];
  selectedLocationId: string | null;
  onSelect: (locationId: string | null) => void;
};

function getLocationIcon(name: string): React.ComponentProps<typeof Ionicons>['name'] {
  const normalized = name.toLowerCase();

  if (normalized === 'all') {
    return 'layers-outline';
  }

  if (normalized === 'pantry') {
    return 'cube-outline';
  }

  if (normalized === 'fridge') {
    return 'thermometer-outline';
  }

  if (normalized === 'freezer') {
    return 'snow-outline';
  }

  return 'location-outline';
}

export function LocationFilterTabs({
  locations,
  selectedLocationId,
  onSelect,
}: LocationFilterTabsProps) {
  const { isDesktop } = useResponsive();

  const tabs = (
    <>
      <FilterTab
        label="All"
        icon="layers-outline"
        selected={selectedLocationId === null}
        onPress={() => onSelect(null)}
        desktop={isDesktop}
      />
      {locations.map((location) => (
        <FilterTab
          key={location.id}
          label={location.name}
          icon={getLocationIcon(location.name)}
          selected={selectedLocationId === location.id}
          onPress={() => onSelect(location.id)}
          desktop={isDesktop}
        />
      ))}
    </>
  );

  if (isDesktop) {
    return <View className="mb-4 flex-row flex-wrap gap-1 self-start">{tabs}</View>;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 self-start">
      <View className="flex-row gap-2">{tabs}</View>
    </ScrollView>
  );
}

type FilterTabProps = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  selected: boolean;
  onPress: () => void;
  desktop: boolean;
};

function FilterTab({ label, icon, selected, onPress, desktop }: FilterTabProps) {
  const { palette } = useTheme();

  if (desktop) {
    return (
      <Pressable
        onPress={onPress}
        className={cn(
          'flex-row items-center rounded-card px-3 py-3',
          selected && 'bg-black/5 dark:bg-white/10',
        )}>
        <Ionicons
          name={icon}
          size={20}
          color={selected ? palette.brand : palette.textSecondary}
        />
        <Text
          className={cn(
            'ml-3 text-sm',
            selected
              ? 'font-semibold text-text dark:text-text-dark'
              : 'text-text-secondary dark:text-text-dark-secondary',
          )}>
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'rounded-full border px-4 py-2',
        selected
          ? 'border-brand bg-brand/10 dark:border-brand-dark'
          : 'border-border bg-surface-secondary dark:border-border-dark dark:bg-surface-dark-secondary',
      )}>
      <Text className={selected ? 'font-medium text-brand dark:text-brand-dark' : ''}>{label}</Text>
    </Pressable>
  );
}
