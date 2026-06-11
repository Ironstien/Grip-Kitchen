import { Slot } from 'expo-router';
import { View } from 'react-native';

import { MasterDetailLayout } from '@/components/layout/MasterDetailLayout';
import { RecipeMasterList } from '@/components/recipes/RecipeMasterList';
import { useResponsive } from '@/hooks/useResponsive';

export default function RecipesLayout() {
  const { isDesktop } = useResponsive();

  if (!isDesktop) {
    return <Slot />;
  }

  return (
    <MasterDetailLayout master={<RecipeMasterList />}>
      <View className="flex-1">
        <Slot />
      </View>
    </MasterDetailLayout>
  );
}
