import { DetailEmptyState } from '@/components/layout/DetailPaneHeader';
import { useResponsive } from '@/hooks/useResponsive';
import { Redirect } from 'expo-router';

export default function IngredientsIndexScreen() {
  const { isDesktop } = useResponsive();

  if (!isDesktop) {
    return <Redirect href={'/(main)/(tabs)/ingredients' as import('expo-router').Href} />;
  }

  return (
    <DetailEmptyState
      title="Select an ingredient"
      description="Choose an ingredient from the list to edit purchase details, stock units, and conversions."
    />
  );
}
