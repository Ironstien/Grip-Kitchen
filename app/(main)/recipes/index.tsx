import { DetailEmptyState } from '@/components/layout/DetailPaneHeader';
import { useResponsive } from '@/hooks/useResponsive';
import { Redirect } from 'expo-router';

export default function RecipesIndexScreen() {
  const { isDesktop } = useResponsive();

  if (!isDesktop) {
    return <Redirect href={'/(main)/(tabs)/recipes' as import('expo-router').Href} />;
  }

  return (
    <DetailEmptyState
      title="Select a recipe"
      description="Choose a recipe from the list to view ingredients, costs, and instructions."
    />
  );
}
