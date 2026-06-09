import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Href, usePathname, useRouter } from 'expo-router';

import { useTheme } from '@/contexts/ThemeContext';

type FabAction = {
  label: string;
  href?: Href;
};

const FAB_ACTIONS: Record<string, FabAction> = {
  '/': {
    label: 'Add meal note',
  },
  '/index': {
    label: 'Add meal note',
  },
  '/(main)/(tabs)': {
    label: 'Add meal note',
  },
  '/(main)/(tabs)/index': {
    label: 'Add meal note',
  },
  '/pantry': {
    label: 'Add to pantry',
    href: '/(main)/inventory/new',
  },
  '/(main)/(tabs)/pantry': {
    label: 'Add to pantry',
    href: '/(main)/inventory/new',
  },
  '/recipes': {
    label: 'Add recipe',
    href: '/(main)/recipes/new',
  },
  '/(main)/(tabs)/recipes': {
    label: 'Add recipe',
    href: '/(main)/recipes/new',
  },
  '/planner': {
    label: 'Add meal to plan',
  },
  '/(main)/(tabs)/planner': {
    label: 'Add meal to plan',
  },
  '/shop': {
    label: 'Add to shopping list',
  },
  '/(main)/(tabs)/shop': {
    label: 'Add to shopping list',
  },
};

function getFabAction(pathname: string): FabAction {
  if (FAB_ACTIONS[pathname]) {
    return FAB_ACTIONS[pathname];
  }

  if (pathname.includes('pantry')) {
    return FAB_ACTIONS['/(main)/(tabs)/pantry'];
  }
  if (pathname.includes('recipes')) {
    return FAB_ACTIONS['/(main)/(tabs)/recipes'];
  }
  if (pathname.includes('planner')) {
    return FAB_ACTIONS['/(main)/(tabs)/planner'];
  }
  if (pathname.includes('shop')) {
    return FAB_ACTIONS['/(main)/(tabs)/shop'];
  }

  return FAB_ACTIONS['/(main)/(tabs)/index'];
}

export function FloatingActionButton() {
  const pathname = usePathname();
  const router = useRouter();
  const { palette } = useTheme();
  const action = getFabAction(pathname);

  const handlePress = () => {
    if (action.href) {
      router.push(action.href);
      return;
    }

    // Phase 5 actions remain placeholders for now.
  };

  if (!action.href) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      onPress={handlePress}
      className="absolute bottom-24 right-5 z-50 h-14 w-14 items-center justify-center rounded-full bg-brand shadow-fab dark:bg-brand-dark">
      <Ionicons name="add" size={28} color="#FFFFFF" />
    </Pressable>
  );
}
