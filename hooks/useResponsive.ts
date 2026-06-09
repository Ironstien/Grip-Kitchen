import { useWindowDimensions } from 'react-native';

import { DESKTOP_BREAKPOINT } from '@/constants/theme';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const isMobile = !isDesktop;

  return {
    width,
    height,
    isDesktop,
    isMobile,
  };
}
