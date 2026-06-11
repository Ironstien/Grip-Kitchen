import type { ReactNode } from 'react';
import { View } from 'react-native';

export const RECIPE_DESKTOP_HERO_HEIGHT = 140;

type RecipeDesktopLayoutProps = {
  heroImage?: ReactNode;
  ingredients: ReactNode;
  instructions: ReactNode;
  footer?: ReactNode;
};

export function RecipeDesktopLayout({
  heroImage,
  ingredients,
  instructions,
  footer,
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
        <View className="min-h-0 flex-1 border-l border-border pl-5 dark:border-border-dark">
          {instructions}
        </View>
      </View>

      {footer ? <View className="border-t border-border pt-4 dark:border-border-dark">{footer}</View> : null}
    </View>
  );
}
