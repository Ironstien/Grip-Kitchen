import { View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

type ConfirmSheetProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
};

export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onCancel} title={title}>
      <Text variant="bodySecondary" className="mb-4">
        {message}
      </Text>
      <View className="flex-row gap-2 pb-2">
        <Button label={cancelLabel} variant="ghost" onPress={onCancel} disabled={isLoading} className="flex-1" />
        <Button
          label={isLoading ? 'Working…' : confirmLabel}
          onPress={onConfirm}
          disabled={isLoading}
          className="flex-1"
        />
      </View>
    </BottomSheet>
  );
}
