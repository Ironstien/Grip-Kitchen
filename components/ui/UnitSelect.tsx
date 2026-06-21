import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { FieldDropdownPanel, useFieldDropdown } from '@/components/ui/FieldDropdown';
import { Text } from '@/components/ui/Text';
import { UNIT_FAMILY_LABELS, type UnitFamily } from '@/constants/inventory';
import { useUserUnits } from '@/hooks/useUserUnits';
import { cn } from '@/lib/cn';
import { fieldSurfaceClassName } from '@/lib/fieldStyles';
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
  const { anchorRef, open, anchor, openDropdown, close } = useFieldDropdown({ minWidth: 240 });

  const units = unitsProp ?? fetchedUnits ?? [];
  const grouped = useMemo(() => groupUnits(units), [units]);
  const selected = units.find((unit) => unit.symbol === value);

  const handleSelect = (symbol: string) => {
    onChange(symbol);
    close();
  };

  const triggerLabel = selected
    ? compact
      ? selected.symbol
      : selected.label
        ? `${selected.symbol} — ${selected.label}`
        : selected.symbol
    : placeholder;

  return (
    <View ref={anchorRef} collapsable={false} className={className}>
      {label && (
        <Text variant="label" className="mb-2">
          {label}
        </Text>
      )}
      <Pressable
        onPress={() => units.length > 0 && openDropdown()}
        disabled={units.length === 0}
        className={cn(
          'flex-row items-center justify-between min-h-[32px] px-2 py-1',
          fieldSurfaceClassName,
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

      <FieldDropdownPanel visible={open} anchor={anchor} onClose={close} minWidth={240} maxHeight={360}>
        <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
          {FAMILY_ORDER.map((family) => {
            const familyUnits = grouped[family];
            if (familyUnits.length === 0) {
              return null;
            }

            return (
              <View key={family}>
                <Text variant="label" className="border-b border-border bg-surface-secondary px-2 py-1.5 dark:border-border-dark dark:bg-surface-dark-secondary">
                  {UNIT_FAMILY_LABELS[family]}
                </Text>
                {familyUnits.map((unit) => {
                  const isSelected = unit.symbol === value;
                  return (
                    <Pressable
                      key={unit.id}
                      onPress={() => handleSelect(unit.symbol)}
                      className={cn(
                        'border-b border-border px-2 py-2 dark:border-border-dark',
                        isSelected && 'bg-brand/10 dark:bg-brand-dark/10',
                      )}>
                      <Text className={cn('text-sm', isSelected && 'font-medium text-brand dark:text-brand-dark')}>
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
      </FieldDropdownPanel>
    </View>
  );
}
