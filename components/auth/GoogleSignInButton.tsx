import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/cn';

type GoogleSignInButtonProps = {
  onPress: () => Promise<void>;
  disabled?: boolean;
  className?: string;
};

export function GoogleSignInButton({ onPress, disabled = false, className }: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePress = async () => {
    try {
      setIsLoading(true);
      await onPress();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign-in failed.';
      Alert.alert('Sign in failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || isLoading}
      onPress={() => void handlePress()}
      className={cn(
        'min-h-[52px] flex-row items-center justify-center rounded-card border border-border bg-white px-5 active:opacity-80 dark:border-border-dark dark:bg-surface-dark-secondary',
        (disabled || isLoading) && 'opacity-60',
        className,
      )}>
      <View className="mr-3">
        <Ionicons name="logo-google" size={20} color="#4285F4" />
      </View>
      <Text className="text-base font-semibold text-text dark:text-text-dark">
        {isLoading ? 'Signing in...' : 'Continue with Google'}
      </Text>
    </Pressable>
  );
}
