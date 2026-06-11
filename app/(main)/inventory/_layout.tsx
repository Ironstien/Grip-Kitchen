import { Slot } from 'expo-router';
import { View } from 'react-native';

import { PantryMasterList } from '@/components/pantry/PantryMasterList';
import { MasterDetailLayout } from '@/components/layout/MasterDetailLayout';
import { useResponsive } from '@/hooks/useResponsive';

export default function InventoryLayout() {
  const { isDesktop } = useResponsive();

  if (!isDesktop) {
    return <Slot />;
  }

  return (
    <MasterDetailLayout master={<PantryMasterList />}>
      <View className="flex-1">
        <Slot />
      </View>
    </MasterDetailLayout>
  );
}
