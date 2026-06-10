import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';
import { Href, useRouter } from 'expo-router';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import type { Recipe } from '@/types/database';

type RecipeGridProps = {
  recipes: Recipe[];
  dense?: boolean;
};

export function RecipeGrid({ recipes, dense = false }: RecipeGridProps) {
  const router = useRouter();
  const imageHeight = dense ? 72 : 100;
  const cardWidth = dense ? '18%' : '48%';

  return (
    <View className={dense ? 'flex-row flex-wrap gap-2' : 'flex-row flex-wrap gap-2'}>
      {recipes.map((recipe) => (
        <Pressable
          key={recipe.id}
          style={{ width: cardWidth }}
          onPress={() => router.push(`/(main)/recipes/${recipe.id}` as Href)}>
          <Card dense className="overflow-hidden p-0">
            {recipe.hero_image_url ? (
              <Image
                source={{ uri: recipe.hero_image_url }}
                style={{ width: '100%', height: imageHeight }}
                contentFit="cover"
              />
            ) : (
              <View
                className="items-center justify-center bg-surface-secondary dark:bg-surface-dark-secondary"
                style={{ height: imageHeight }}>
                <Text variant="caption">No photo</Text>
              </View>
            )}
            <View className="gap-0.5 p-2">
              <Text className="text-xs font-semibold" numberOfLines={2}>
                {recipe.title}
              </Text>
              {recipe.time_to_cook != null && (
                <Text variant="caption">{recipe.time_to_cook} min</Text>
              )}
              {recipe.dietary_tags.length > 0 && (
                <Text variant="caption" numberOfLines={1}>
                  {recipe.dietary_tags.join(' · ')}
                </Text>
              )}
            </View>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}
