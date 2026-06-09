import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { colors, ThemeMode } from '@/constants/theme';

const THEME_STORAGE_KEY = 'grip-kitchen-theme';

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  palette: (typeof colors)[ThemeMode];
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark') {
          setMode(stored);
        }
      })
      .finally(() => setHydrated(true));
  }, []);

  const setTheme = useCallback((nextMode: ThemeMode) => {
    setMode(nextMode);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(mode === 'light' ? 'dark' : 'light');
  }, [mode, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      isDark: mode === 'dark',
      palette: colors[mode],
      toggleTheme,
      setTheme,
    }),
    [mode, setTheme, toggleTheme],
  );

  if (!hydrated) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
