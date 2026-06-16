import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/cn';

type IngredientThumbnailProps = {
  uri?: string | null;
  size?: number;
  className?: string;
};

export function IngredientThumbnail({ uri, size = 40, className }: IngredientThumbnailProps) {
  const { palette } = useTheme();

  return (
    <View
      className={cn('shrink-0 overflow-hidden rounded-button border border-border dark:border-border-dark', className)}
      style={{ width: size, height: size }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" />
      ) : (
        <View
          className="h-full w-full items-center justify-center"
          style={{ backgroundColor: palette.backgroundSecondary }}>
          <Ionicons name="image-outline" size={Math.round(size * 0.38)} color={palette.textMuted} />
        </View>
      )}
    </View>
  );
}
