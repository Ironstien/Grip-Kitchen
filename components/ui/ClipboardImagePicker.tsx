import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Alert, Platform, Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { readClipboardImage, revokeLocalImageUri } from '@/lib/clipboardImage';
import { cn } from '@/lib/cn';
import { fieldPanelClassName } from '@/lib/fieldStyles';

type ClipboardImagePickerProps = {
  value?: string | null;
  onChange: (uri: string, mimeType?: string) => void;
  onClear?: () => void;
  label?: string;
  emptyLabel?: string;
  height?: number;
  size?: number;
  compact?: boolean;
  className?: string;
};

export function ClipboardImagePicker({
  value,
  onChange,
  onClear,
  label = 'Photo',
  emptyLabel,
  height = 180,
  size,
  compact = false,
  className,
}: ClipboardImagePickerProps) {
  useEffect(() => {
    return () => {
      revokeLocalImageUri(value);
    };
  }, [value]);

  const handlePress = async () => {
    if (Platform.OS === 'web') {
      const clipboardImage = await readClipboardImage();
      if (clipboardImage) {
        revokeLocalImageUri(value);
        onChange(clipboardImage.uri, clipboardImage.mimeType);
        return;
      }

      Alert.alert(
        'No image in clipboard',
        'Copy an image from another site (right-click → Copy image), then click here to paste.',
      );
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to choose an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      revokeLocalImageUri(value);
      onChange(result.assets[0].uri, result.assets[0].mimeType ?? 'image/jpeg');
    }
  };

  const placeholderText =
    emptyLabel ??
    (Platform.OS === 'web'
      ? 'Click to paste image from clipboard'
      : 'Tap to choose a photo');

  return (
    <View className={className}>
      {label ? (
        <Text variant="label" className="mb-1">
          {label}
        </Text>
      ) : null}

      <View className="relative" style={{ width: size, height: size ? size : undefined }}>
        <Pressable
          onPress={() => void handlePress()}
          accessibilityRole="button"
          accessibilityLabel={placeholderText}
          className={cn('cursor-pointer overflow-hidden', fieldPanelClassName)}
          style={size ? { width: size, height: size } : { height }}>
          {value ? (
            <Image
              source={{ uri: value }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <View
              className="h-full w-full items-center justify-center border border-dashed border-field-border px-2"
              style={size ? { width: size, height: size } : undefined}>
              <Text variant="caption" className="text-center">
                {compact ? 'Paste' : placeholderText}
              </Text>
            </View>
          )}
        </Pressable>

        {value && onClear && compact ? (
          <Pressable
            onPress={onClear}
            accessibilityRole="button"
            accessibilityLabel="Remove photo"
            className="absolute -right-1 -top-1 rounded-full bg-surface p-0.5 shadow-field dark:bg-surface-dark">
            <Ionicons name="close-circle" size={18} color="#666666" />
          </Pressable>
        ) : null}
      </View>

      {value && onClear && !compact ? (
        <Pressable onPress={onClear} className="mt-1 self-start">
          <Text variant="caption" className="text-brand dark:text-brand-dark">
            Remove photo
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
