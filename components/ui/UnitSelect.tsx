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
}: UnitSelectProps) {
  const { data: fetchedUnits = [] } = useUserUnits();
  const [open, setOpen] = useState(false);

  const units = useMemo(() => {
    const source = unitsProp ?? fetchedUnits;
    if (value && !source.some((unit) => unit.symbol === value)) {
      return [
        {
          id: `legacy-${value}`,
          user_id: '',
          symbol: value,
          label: value,
          family: 'count' as const,
          base_unit: 'each',
          to_base_multiplier: 1,
          sort_order: -1,
          is_system: true,
        },
        ...source,
      ];
    }
    return source;
  }, [unitsProp, fetchedUnits, value]);

  const grouped = useMemo(() => groupUnits(units), [units]);
  const selected = units.find((unit) => unit.symbol === value);

  const handleSelect = (symbol: string) => {
    onChange(symbol);
    setOpen(false);
  };

  return (
    <View className={className}>
      {label && (
        <Text variant="label" className="mb-2">
          {label}
        </Text>
      )}
      <Pressable
        onPress={() => setOpen(true)}
        className="min-h-[48px] flex-row items-center justify-between rounded-button border border-border bg-surface px-4 dark:border-border-dark dark:bg-surface-dark-secondary">
        <Text className={selected ? '' : 'text-text-secondary dark:text-text-dark-secondary'}>
          {selected ? (selected.label ? `${selected.symbol} — ${selected.label}` : selected.symbol) : placeholder}
        </Text>
        <Text variant="caption">▼</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="absolute inset-0" onPress={() => setOpen(false)} />
          <View className="max-h-[70%] rounded-t-card border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark">
            <Text className="mb-4 text-lg font-semibold">Select unit</Text>
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
