import { useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { OptionSelect } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { UNIT_FAMILY_LABELS, type UnitFamily } from '@/constants/inventory';
import { useUserUnitMutations, useUserUnits } from '@/hooks/useUserUnits';
import { formatUnitConversion } from '@/lib/services/userUnits';
import type { UserUnit } from '@/types/database';

const FAMILY_ORDER: UnitFamily[] = ['mass', 'volume', 'count'];

const DEFAULT_BASE_UNITS: Record<UnitFamily, string> = {
  mass: 'g',
  volume: 'ml',
  count: 'each',
};

function getBaseUnitOptions(family: UnitFamily, units: UserUnit[]): string[] {
  const familyUnits = units.filter((unit) => unit.family === family).map((unit) => unit.symbol);
  const preferred =
    family === 'mass'
      ? ['g', 'kg']
      : family === 'volume'
        ? ['ml', 'L', 'cup', 'tbsp', 'tsp']
        : ['each'];

  const ordered = preferred.filter((symbol) => familyUnits.includes(symbol));
  return ordered.length > 0 ? ordered : [DEFAULT_BASE_UNITS[family]];
}

export function UnitsManager() {
  const { data: units = [], isLoading } = useUserUnits();
  const { create, update, remove } = useUserUnitMutations();

  const [symbol, setSymbol] = useState('');
  const [label, setLabel] = useState('');
  const [family, setFamily] = useState<UnitFamily>('count');
  const [baseUnit, setBaseUnit] = useState('each');
  const [multiplier, setMultiplier] = useState('1');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingMultiplier, setEditingMultiplier] = useState('');

  const grouped = useMemo(
    () =>
      FAMILY_ORDER.reduce(
        (groups, entry) => {
          groups[entry] = units.filter((unit) => unit.family === entry);
          return groups;
        },
        { mass: [], volume: [], count: [] } as Record<UnitFamily, UserUnit[]>,
      ),
    [units],
  );

  const baseUnitOptions = useMemo(() => getBaseUnitOptions(family, units), [family, units]);

  const resetForm = () => {
    setSymbol('');
    setLabel('');
    setFamily('count');
    setBaseUnit(DEFAULT_BASE_UNITS.count);
    setMultiplier('1');
  };

  const handleFamilyChange = (nextFamily: UnitFamily) => {
    setFamily(nextFamily);
    const options = getBaseUnitOptions(nextFamily, units);
    setBaseUnit(options[0] ?? DEFAULT_BASE_UNITS[nextFamily]);
  };

  const handleCreate = async () => {
    const trimmedSymbol = symbol.trim();
    const parsedMultiplier = Number(multiplier);

    if (!trimmedSymbol) {
      Alert.alert('Missing symbol', 'Enter a short unit name like box or punnet.');
      return;
    }

    if (Number.isNaN(parsedMultiplier) || parsedMultiplier <= 0) {
      Alert.alert('Invalid conversion', 'Enter how many base units equal one of your unit.');
      return;
    }

    if (units.some((unit) => unit.symbol.toLowerCase() === trimmedSymbol.toLowerCase())) {
      Alert.alert('Unit exists', 'That unit symbol is already in your list.');
      return;
    }

    try {
      await create.mutateAsync({
        symbol: trimmedSymbol,
        label: label.trim() || trimmedSymbol,
        family,
        base_unit: baseUnit,
        to_base_multiplier: parsedMultiplier,
      });
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Create failed.';
      Alert.alert('Could not add unit', message);
    }
  };

  const handleSaveConversion = async (unit: UserUnit) => {
    const parsedMultiplier = Number(editingMultiplier);
    if (Number.isNaN(parsedMultiplier) || parsedMultiplier <= 0) {
      Alert.alert('Invalid conversion', 'Enter a positive number.');
      return;
    }

    try {
      await update.mutateAsync({
        id: unit.id,
        input: { to_base_multiplier: parsedMultiplier },
      });
      setEditingId(null);
      setEditingMultiplier('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update failed.';
      Alert.alert('Could not update unit', message);
    }
  };

  const handleDelete = (unit: UserUnit) => {
    Alert.alert('Delete unit', `Remove ${unit.symbol} from your unit list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void remove.mutateAsync(unit.id).catch((error: unknown) => {
            const message = error instanceof Error ? error.message : 'Delete failed.';
            Alert.alert('Could not delete unit', message);
          });
        },
      },
    ]);
  };

  if (isLoading) {
    return <Text variant="bodySecondary">Loading units...</Text>;
  }

  return (
    <View className="gap-4">
      <Text variant="label">Units & conversions</Text>
      <Text variant="bodySecondary">
        Australian defaults are provided for mass, volume, and count. Add custom units and set how
        they convert (e.g. 1 box = 6 each).
      </Text>

      {FAMILY_ORDER.map((familyKey) => {
        const familyUnits = grouped[familyKey];
        if (familyUnits.length === 0) {
          return null;
        }

        return (
          <View key={familyKey} className="gap-2">
            <Text variant="label">{UNIT_FAMILY_LABELS[familyKey]}</Text>
            {familyUnits.map((unit) => (
              <View
                key={unit.id}
                className="gap-2 rounded-card border border-border px-3 py-3 dark:border-border-dark">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="font-medium">
                      {unit.symbol}
                      {unit.label && unit.label !== unit.symbol ? ` — ${unit.label}` : ''}
                    </Text>
                    <Text variant="caption">{formatUnitConversion(unit)}</Text>
                  </View>
                  {!unit.is_system && (
                    <Pressable onPress={() => handleDelete(unit)}>
                      <Text className="text-status-danger">Delete</Text>
                    </Pressable>
                  )}
                </View>

                {!unit.is_system && (
                  <View className="flex-row items-center gap-3">
                    {editingId === unit.id ? (
                      <>
                        <Input
                          value={editingMultiplier}
                          onChangeText={setEditingMultiplier}
                          keyboardType="decimal-pad"
                          placeholder={`per ${unit.base_unit}`}
                          className="flex-1"
                          autoFocus
                        />
                        <Button label="Save" onPress={() => void handleSaveConversion(unit)} />
                      </>
                    ) : (
                      <Pressable
                        onPress={() => {
                          setEditingId(unit.id);
                          setEditingMultiplier(String(unit.to_base_multiplier));
                        }}>
                        <Text className="text-brand dark:text-brand-dark">Edit conversion</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        );
      })}

      <View className="gap-3 rounded-card border border-border p-3 dark:border-border-dark">
        <Text variant="label">Add custom unit</Text>
        <View className="flex-row gap-3">
          <Input
            value={symbol}
            onChangeText={setSymbol}
            placeholder="Symbol (e.g. box)"
            className="flex-1"
            autoCapitalize="none"
          />
          <Input
            value={label}
            onChangeText={setLabel}
            placeholder="Label (optional)"
            className="flex-1"
          />
        </View>

        <OptionSelect
          label="Type"
          value={family}
          options={FAMILY_ORDER.map((entry) => UNIT_FAMILY_LABELS[entry])}
          onChange={(selected) => {
            const match = FAMILY_ORDER.find((entry) => UNIT_FAMILY_LABELS[entry] === selected);
            if (match) {
              handleFamilyChange(match);
            }
          }}
        />

        <Text variant="label">Conversion rule</Text>
        <Text variant="caption" className="mb-2">
          1 new unit equals how many of an existing unit?
        </Text>
        <View className="flex-row flex-wrap items-center gap-3">
          <Text variant="bodySecondary">1 {symbol.trim() || '…'} =</Text>
          <Input
            value={multiplier}
            onChangeText={setMultiplier}
            keyboardType="decimal-pad"
            className="w-24"
          />
          <OptionSelect value={baseUnit} options={baseUnitOptions} onChange={setBaseUnit} />
        </View>

        <Button label="Add unit" onPress={() => void handleCreate()} />
      </View>
    </View>
  );
}
