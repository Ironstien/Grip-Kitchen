import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { IngredientThumbnail } from '@/components/ui/IngredientThumbnail';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/contexts/ThemeContext';

type MasterListPaneProps = {
  title: string;
  onCreate?: () => void;
  createLabel?: string;
  filters?: ReactNode;
  children: ReactNode;
};

export function MasterListPane({
  title,
  onCreate,
  createLabel = 'New',
  filters,
  children,
}: MasterListPaneProps) {
  const { palette } = useTheme();

  return (
    <View className="h-full">
      <View
        className="flex-row items-center justify-between border-b border-border px-3 py-2.5 dark:border-border-dark"
        style={{ backgroundColor: palette.masterList }}>
        <Text className="text-sm font-semibold text-text dark:text-text-dark">{title}</Text>
        <View className="flex-row items-center gap-1">
          {onCreate ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={createLabel}
              onPress={onCreate}
              className="h-7 w-7 items-center justify-center rounded-button bg-brand active:opacity-80">
              <Ionicons name="add" size={18} color="#FFFFFF" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {filters ? (
        <View
          className="border-b border-border px-3 py-2 dark:border-border-dark"
          style={{ backgroundColor: palette.masterList }}>
          {filters}
        </View>
      ) : null}

      <View className="flex-1">{children}</View>
    </View>
  );
}

type MasterListRowProps = {
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: ReactNode;
  trailing?: string;
  imageUrl?: string | null;
  showThumbnail?: boolean;
  accessory?: ReactNode;
  selected?: boolean;
  onPress: () => void;
};

export function MasterListRow({
  title,
  subtitle,
  meta,
  badge,
  trailing,
  imageUrl,
  showThumbnail = false,
  accessory,
  selected = false,
  onPress,
}: MasterListRowProps) {
  const { palette } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="border-b border-border px-3 py-2.5 dark:border-border-dark"
      style={{
        backgroundColor: selected ? palette.masterListSelected : palette.masterList,
        borderLeftWidth: selected ? 3 : 0,
        borderLeftColor: selected ? palette.brand : 'transparent',
      }}>
      <View className="flex-row items-center gap-2.5">
        <View className="min-w-0 flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <Text className="flex-1 text-sm font-semibold text-text dark:text-text-dark" numberOfLines={1}>
              {title}
            </Text>
            {trailing ? (
              <Text className="text-xs font-medium text-text-secondary dark:text-text-dark-secondary">
                {trailing}
              </Text>
            ) : null}
          </View>
          {subtitle ? (
            <Text variant="caption" className="mt-0.5" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
          {meta || badge ? (
            <View className="mt-1 flex-row items-center justify-between gap-2">
              {meta ? (
                <Text variant="caption" numberOfLines={1}>
                  {meta}
                </Text>
              ) : (
                <View />
              )}
              {badge}
            </View>
          ) : null}
        </View>

        {accessory}
        {showThumbnail ? <IngredientThumbnail uri={imageUrl} size={40} /> : null}
      </View>
    </Pressable>
  );
}

export function MasterListEmpty({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center px-4 py-8">
      <Text variant="bodySecondary" className="text-center">
        {message}
      </Text>
    </View>
  );
}
