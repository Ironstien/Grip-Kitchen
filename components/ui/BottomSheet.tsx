import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/contexts/ThemeContext';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const sheetMaxHeight = height * 0.88 - insets.bottom;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end">
        <View className="flex-1 justify-end bg-black/40">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close sheet"
            className="absolute inset-0"
            onPress={onClose}
          />

          <View
            className="rounded-t-card border-t border-border bg-surface dark:border-border-dark dark:bg-surface-dark"
            style={{ maxHeight: sheetMaxHeight, paddingBottom: Math.max(insets.bottom, 12) }}>
            <View className="items-center pt-2">
              <View className="h-1 w-10 rounded-full bg-border dark:bg-border-dark" />
            </View>

            {title ? (
              <View className="flex-row items-center justify-between px-4 pb-2 pt-3">
                <Text className="flex-1 pr-3 text-lg font-semibold" numberOfLines={2}>
                  {title}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  onPress={onClose}
                  className="h-8 w-8 items-center justify-center rounded-button active:opacity-70">
                  <Ionicons name="close" size={22} color={palette.textSecondary} />
                </Pressable>
              </View>
            ) : null}

            <View className="px-4">{children}</View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
