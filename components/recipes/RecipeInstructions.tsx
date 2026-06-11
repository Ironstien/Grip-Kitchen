import { View } from 'react-native';

import { Text } from '@/components/ui/Text';

type RecipeInstructionsProps = {
  instructions: string;
};

export function RecipeInstructions({ instructions }: RecipeInstructionsProps) {
  const steps = instructions
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (steps.length <= 1) {
    return <Text>{instructions}</Text>;
  }

  return (
    <View className="gap-3">
      {steps.map((step, index) => {
        const withoutNumber = step.replace(/^\d+[\).\s]+/, '');

        return (
          <View key={`${index}-${step.slice(0, 24)}`} className="flex-row gap-3">
            <Text className="w-5 font-semibold text-text-secondary dark:text-text-dark-secondary">
              {index + 1}.
            </Text>
            <Text className="flex-1">{withoutNumber}</Text>
          </View>
        );
      })}
    </View>
  );
}
