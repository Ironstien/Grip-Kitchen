import { DetailEmptyState } from '@/components/layout/DetailPaneHeader';
import { useResponsive } from '@/hooks/useResponsive';
import { Redirect } from 'expo-router';

export default function InventoryIndexScreen() {
  const { isDesktop } = useResponsive();

  if (!isDesktop) {
    return <Redirect href={'/(main)/(tabs)/pantry' as import('expo-router').Href} />;
  }

  return (
    <DetailEmptyState
      title="Select a pantry item"
      description="Choose an item from the list to adjust stock, location, and expiry."
    />
  );
}
