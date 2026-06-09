import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { MasterIngredientsManager } from '@/components/settings/MasterIngredientsManager';
import { SettingsTabs, type SettingsTab } from '@/components/settings/SettingsTabs';
import { StorageLocationsManager } from '@/components/settings/StorageLocationsManager';
import { UnitsManager } from '@/components/settings/UnitsManager';
import { Button } from '@/components/ui';
import { Heading, Text } from '@/components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';

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

  return (
    <ScrollView
      className="flex-1 bg-surface dark:bg-surface-dark"
      contentContainerClassName={`flex-grow ${isDesktop ? 'px-8 py-6' : 'px-5 py-5'}`}>
      <View className="mb-6">
        <Heading level={isDesktop ? 1 : 2}>Settings</Heading>
        <Text variant="bodySecondary" className="mt-1">
          Manage your master ingredient list, units, locations, and preferences.
        </Text>
      </View>

      <SettingsTabs activeTab={activeTab} onChange={setActiveTab} />

      <View className={activeTab === 'master' && isDesktop ? 'w-full' : 'max-w-md'}>
        {activeTab === 'general' && (
          <View className="gap-6">
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

        {activeTab === 'units' && <UnitsManager />}

        {activeTab === 'locations' && <StorageLocationsManager />}
      </View>
    </ScrollView>
  );
}
