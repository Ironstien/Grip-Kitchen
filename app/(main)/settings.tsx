import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { MasterDetailLayout } from '@/components/layout/MasterDetailLayout';
import { DetailPaneHeader } from '@/components/layout/DetailPaneHeader';
import { CategoriesManager } from '@/components/settings/CategoriesManager';
import { MasterIngredientsManager } from '@/components/settings/MasterIngredientsManager';
import { SettingsTabs, type SettingsTab } from '@/components/settings/SettingsTabs';
import { StorageLocationsManager } from '@/components/settings/StorageLocationsManager';
import { UnitsManager } from '@/components/settings/UnitsManager';
import { Button } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { detailPaddingClass } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

const TAB_TITLES: Record<SettingsTab, string> = {
  general: 'General',
  master: 'Master Ingredient List',
  categories: 'Master Category List',
  units: 'Master Units List',
  locations: 'Locations',
};

export default function SettingsScreen() {
  const { mode, toggleTheme } = useTheme();
  const { user, profile, signOut } = useAuth();
  const { isDesktop } = useResponsive();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign out failed.';
      Alert.alert('Sign out failed', message);
    } finally {
      setIsSigningOut(false);
    }
  };

  const tabContent = (
    <View
      className={
        (activeTab === 'master' || activeTab === 'units') && isDesktop
          ? 'w-full'
          : activeTab === 'categories' && isDesktop
            ? 'max-w-2xl'
            : 'max-w-md'
      }>
      {activeTab === 'general' && (
        <View className="gap-4">
          <View>
            <Text variant="label" className="mb-2">
              Account
            </Text>
            <Text variant="bodySecondary">{profile?.email ?? user?.email ?? 'Signed in'}</Text>
            <Button
              label={isSigningOut ? 'Signing out...' : 'Sign out'}
              variant="ghost"
              onPress={() => void handleSignOut()}
              disabled={isSigningOut}
              className="mt-3"
            />
          </View>

          <View>
            <Text variant="label" className="mb-2">
              Appearance
            </Text>
            <Button
              label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              variant="secondary"
              onPress={toggleTheme}
            />
          </View>

          <Text variant="caption">
            More settings (categories, export, account delete) arrive in Phase 5. Currency is fixed
            to AUD.
          </Text>
        </View>
      )}

      {activeTab === 'master' && <MasterIngredientsManager />}

      {activeTab === 'categories' && <CategoriesManager />}

      {activeTab === 'units' && <UnitsManager />}

      {activeTab === 'locations' && <StorageLocationsManager />}
    </View>
  );

  if (isDesktop) {
    return (
      <MasterDetailLayout master={<SettingsTabs activeTab={activeTab} onChange={setActiveTab} />}>
        <View className="flex-1 bg-surface dark:bg-surface-dark">
          <DetailPaneHeader
            title={TAB_TITLES[activeTab]}
            subtitle="Manage your master lists, locations, and preferences."
          />
          <ScrollView
            className="flex-1"
            contentContainerClassName={`${detailPaddingClass(true)} pb-8`}>
            {tabContent}
          </ScrollView>
        </View>
      </MasterDetailLayout>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-surface dark:bg-surface-dark"
      contentContainerClassName="flex-grow px-4 py-4">
      <View className="mb-4">
        <Text className="text-xl font-bold text-text dark:text-text-dark">Settings</Text>
        <Text variant="caption" className="mt-0.5">
          Manage your master ingredient, category, and unit lists, locations, and preferences.
        </Text>
      </View>

      <SettingsTabs activeTab={activeTab} onChange={setActiveTab} />
      {tabContent}
    </ScrollView>
  );
}
