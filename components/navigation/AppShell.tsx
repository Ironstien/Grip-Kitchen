import { View } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DesktopSidebar } from '@/components/navigation/DesktopSidebar';
import { FloatingActionButton } from '@/components/navigation/FloatingActionButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';
import { useUserUnits } from '@/hooks/useUserUnits';

export function AppShell() {
  const { isDark, palette } = useTheme();
  const { isDesktop, isMobile } = useResponsive();
  useUserUnits();

  return (
    <SafeAreaView
      className="flex-1 bg-surface-secondary dark:bg-surface-dark-secondary"
      style={{ backgroundColor: palette.backgroundSecondary }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View className="flex-1 flex-row">
        {isDesktop && <DesktopSidebar />}
        <View className="relative flex-1">
          <Slot />
          {isMobile && <FloatingActionButton />}
        </View>
      </View>
    </SafeAreaView>
  );
}
