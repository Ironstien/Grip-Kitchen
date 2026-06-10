import type { ReactNode } from 'react';
import { View } from 'react-native';

export const RECIPE_DESKTOP_HERO_HEIGHT = 140;

type RecipeDesktopLayoutProps = {
  heroImage?: ReactNode;
  ingredients: ReactNode;
  metadata: ReactNode;
  instructions: ReactNode;
};

export function RecipeDesktopLayout({
  heroImage,
  ingredients,
  metadata,
  instructions,
}: RecipeDesktopLayoutProps) {
  return (
    <View className="gap-5">
      {heroImage ? (
        <View
          className="overflow-hidden rounded-card"
          style={{ height: RECIPE_DESKTOP_HERO_HEIGHT }}>
          {heroImage}
        </View>
      ) : null}

      <View className="flex-row items-start gap-5">
        <View className="w-[38%] shrink-0">{ingredients}</View>
        <View className="min-h-0 flex-1 flex-col gap-4">
          <View className="shrink-0">{metadata}</View>
          <View className="min-h-0 flex-1">{instructions}</View>
        </View>
      </View>
    </View>
  );
}
