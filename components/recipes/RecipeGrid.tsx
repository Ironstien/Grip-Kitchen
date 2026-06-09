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

  return (
    <View className={dense ? 'flex-row flex-wrap gap-3' : 'flex-row flex-wrap gap-3'}>
      {recipes.map((recipe) => (
        <Pressable
          key={recipe.id}
          style={{ width: dense ? '23%' : '48%' }}
          onPress={() => router.push(`/(main)/recipes/${recipe.id}` as Href)}>
          <Card dense className="overflow-hidden p-0">
            {recipe.hero_image_url ? (
              <Image
                source={{ uri: recipe.hero_image_url }}
                style={{ width: '100%', height: dense ? 120 : 140 }}
                contentFit="cover"
              />
            ) : (
              <View className="h-[140px] items-center justify-center bg-surface-secondary dark:bg-surface-dark-secondary">
                <Text variant="caption">No photo</Text>
              </View>
            )}
            <View className="gap-1 p-3">
              <Text className={dense ? 'font-semibold' : 'text-base font-semibold'} numberOfLines={2}>
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
