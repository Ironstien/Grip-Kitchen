import { View } from 'react-native';
import { Href, Stack, useRouter } from 'expo-router';

import { RecipeForm } from '@/components/recipes/RecipeForm';
import { IconButton } from '@/components/ui/IconButton';
import { Heading, Text } from '@/components/ui/Text';
import { pagePaddingClass } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

export default function NewRecipeScreen() {
  const router = useRouter();
  const { isDesktop } = useResponsive();

  return (
    <View className={`flex-1 bg-surface dark:bg-surface-dark ${pagePaddingClass(isDesktop)}`}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="mb-3 flex-row items-center gap-2">
        <IconButton name="arrow-back" accessibilityLabel="Go back" onPress={() => router.back()} />
        <View className="flex-1">
          <Heading level={isDesktop ? 1 : 2}>New recipe</Heading>
          <Text variant="caption">Link pantry ingredients and preview costs live.</Text>
        </View>
      </View>
      <RecipeForm
        onSaved={(recipeId) => router.replace(`/(main)/recipes/${recipeId}` as Href)}
        onCancel={() => router.back()}
      />
    </View>
  );
}
