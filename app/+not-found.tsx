import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/ui';
import { Heading, Text } from '@/components/ui/Text';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View className="flex-1 items-center justify-center bg-surface px-6 dark:bg-surface-dark">
        <Heading level={2}>Screen not found</Heading>
        <Text variant="bodySecondary" className="mt-2 text-center">
          This route does not exist in Grip Kitchen yet.
        </Text>
        <Link href="/" asChild>
          <Button label="Go to Today" className="mt-6" />
        </Link>
      </View>
    </>
  );
}
