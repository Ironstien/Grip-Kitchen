import { Slot } from 'expo-router';
import { View } from 'react-native';

import { IngredientMasterList } from '@/components/ingredients/IngredientMasterList';
import { MasterDetailLayout } from '@/components/layout/MasterDetailLayout';
import { useResponsive } from '@/hooks/useResponsive';

export default function IngredientsLayout() {
  const { isDesktop } = useResponsive();

  if (!isDesktop) {
    return <Slot />;
  }

  return (
    <MasterDetailLayout master={<IngredientMasterList />}>
      <View className="flex-1">
        <Slot />
      </View>
    </MasterDetailLayout>
  );
}
