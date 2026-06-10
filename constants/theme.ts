export const DESKTOP_BREAKPOINT = 1280;
export const SIDEBAR_WIDTH = 180;

export function pagePaddingClass(isDesktop: boolean) {
  return isDesktop ? 'px-5 py-4' : 'px-4 py-4';
}

export function pageHeaderMarginClass(isDesktop: boolean) {
  return isDesktop ? 'mb-3' : 'mb-4';
}

export const colors = {
  light: {
    background: '#FFFFFF',
    backgroundSecondary: '#F7F7F8',
    text: '#111111',
    textSecondary: '#666666',
    textMuted: '#999999',
    border: '#E5E5E5',
    brand: '#2563EB',
    statusSuccess: '#16A34A',
    statusWarning: '#D97706',
    statusDanger: '#DC2626',
    tabBar: '#FFFFFF',
    sidebar: '#FAFAFA',
  },
  dark: {
    background: '#191919',
    backgroundSecondary: '#252525',
    text: '#F5F5F5',
    textSecondary: '#A3A3A3',
    textMuted: '#737373',
    border: '#333333',
    brand: '#3B82F6',
    statusSuccess: '#22C55E',
    statusWarning: '#F59E0B',
    statusDanger: '#EF4444',
    tabBar: '#191919',
    sidebar: '#141414',
  },
} as const;

export type ThemeMode = 'light' | 'dark';
