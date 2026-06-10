import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { UNIT_FAMILY_LABELS, type UnitFamily } from '@/constants/inventory';
import { useUserUnits } from '@/hooks/useUserUnits';
import { cn } from '@/lib/cn';
import type { UserUnit } from '@/types/database';

type UnitSelectProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  units?: UserUnit[];
  placeholder?: string;
  compact?: boolean;
};

const FAMILY_ORDER: UnitFamily[] = ['mass', 'volume', 'count'];

function groupUnits(units: UserUnit[]): Record<UnitFamily, UserUnit[]> {
  return units.reduce(
    (groups, unit) => {
      groups[unit.family].push(unit);
      return groups;
    },
    { mass: [], volume: [], count: [] } as Record<UnitFamily, UserUnit[]>,
  );
}

export function UnitSelect({
  label,
  value,
  onChange,
  className,
  units: unitsProp,
  placeholder = 'Select unit',
  compact = true,
}: UnitSelectProps) {
  const { data: fetchedUnits = [], isLoading } = useUserUnits();
  const [open, setOpen] = useState(false);

  const units = unitsProp ?? fetchedUnits ?? [];
  const grouped = useMemo(() => groupUnits(units), [units]);
  const selected = units.find((unit) => unit.symbol === value);

  const handleSelect = (symbol: string) => {
    onChange(symbol);
    setOpen(false);
  };

  const triggerLabel = selected
    ? compact
      ? selected.symbol
      : selected.label
        ? `${selected.symbol} — ${selected.label}`
        : selected.symbol
    : placeholder;

  return (
    <View className={className}>
      {label && (
        <Text variant="label" className="mb-2">
          {label}
        </Text>
      )}
      <Pressable
        onPress={() => setOpen(true)}
        disabled={units.length === 0}
        className={cn(
          'flex-row items-center justify-between border border-border bg-surface dark:border-border-dark dark:bg-surface-dark-secondary',
          'min-h-[32px] rounded px-2 py-1',
          units.length === 0 && 'opacity-60',
        )}>
        <Text
          className={cn(
            compact ? 'text-sm' : '',
            selected ? '' : 'text-text-secondary dark:text-text-dark-secondary',
          )}>
          {isLoading ? 'Loading units...' : units.length === 0 ? 'No units in Master Units List' : triggerLabel}
        </Text>
        <Text variant="caption" className={compact ? 'text-xs' : ''}>
          ▼
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="absolute inset-0" onPress={() => setOpen(false)} />
          <View className="max-h-[70%] rounded-t-card border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark">
            <Text className="mb-4 text-lg font-semibold">Master Units List</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              {FAMILY_ORDER.map((family) => {
                const familyUnits = grouped[family];
                if (familyUnits.length === 0) {
                  return null;
                }

                return (
                  <View key={family} className="mb-4">
                    <Text variant="label" className="mb-2">
                      {UNIT_FAMILY_LABELS[family]}
                    </Text>
                    {familyUnits.map((unit) => {
                      const isSelected = unit.symbol === value;
                      return (
                        <Pressable
                          key={unit.id}
                          onPress={() => handleSelect(unit.symbol)}
                          className={cn(
                            'mb-2 rounded-button border px-3 py-3',
                            isSelected
                              ? 'border-brand bg-brand/10 dark:border-brand-dark'
                              : 'border-border dark:border-border-dark',
                          )}>
                          <Text className={isSelected ? 'font-medium text-brand dark:text-brand-dark' : ''}>
                            {unit.symbol}
                            {unit.label ? ` — ${unit.label}` : ''}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })}
            </ScrollView>
            <Pressable onPress={() => setOpen(false)} className="mt-2 py-3">
              <Text className="text-center text-brand dark:text-brand-dark">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
