export const DESKTOP_BREAKPOINT = 1280;
export const SIDEBAR_WIDTH = 200;
export const MASTER_LIST_WIDTH = 340;

/** Zoho-style dark navigation sidebar (always dark regardless of theme). */
export const NAV_SIDEBAR = {
  background: '#1A233A',
  backgroundHover: 'rgba(255, 255, 255, 0.08)',
  backgroundActive: 'rgba(255, 255, 255, 0.12)',
  accent: '#2098FF',
  text: '#FFFFFF',
  textMuted: 'rgba(255, 255, 255, 0.65)',
  border: 'rgba(255, 255, 255, 0.08)',
} as const;

export function pagePaddingClass(isDesktop: boolean) {
  return isDesktop ? 'px-5 py-4' : 'px-4 py-4';
}

export function detailPaddingClass(isDesktop: boolean) {
  return isDesktop ? 'px-6 py-4' : 'px-4 py-4';
}

export function pageHeaderMarginClass(isDesktop: boolean) {
  return isDesktop ? 'mb-3' : 'mb-4';
}

export const colors = {
  light: {
    background: '#FFFFFF',
    backgroundSecondary: '#F3F3F3',
    text: '#111111',
    textSecondary: '#666666',
    textMuted: '#999999',
    border: '#E5E5E5',
    brand: '#2098FF',
    statusSuccess: '#16A34A',
    statusWarning: '#D97706',
    statusDanger: '#DC2626',
    tabBar: '#FFFFFF',
    sidebar: NAV_SIDEBAR.background,
    masterList: '#FFFFFF',
    masterListSelected: '#F3F3F3',
  },
  dark: {
    background: '#191919',
    backgroundSecondary: '#252525',
    text: '#F5F5F5',
    textSecondary: '#A3A3A3',
    textMuted: '#737373',
    border: '#333333',
    brand: '#2098FF',
    statusSuccess: '#22C55E',
    statusWarning: '#F59E0B',
    statusDanger: '#EF4444',
    tabBar: '#191919',
    sidebar: NAV_SIDEBAR.background,
    masterList: '#1F1F1F',
    masterListSelected: '#2A2A2A',
  },
} as const;

export type ThemeMode = 'light' | 'dark';
