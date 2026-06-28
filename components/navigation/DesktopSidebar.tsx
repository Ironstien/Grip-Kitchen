import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Href, usePathname, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { NAV_SIDEBAR, SIDEBAR_WIDTH } from '@/constants/theme';

type NavItem = {
  href: Href;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  matchPaths: string[];
};

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    href: '/(main)/(tabs)',
    label: 'Today',
    icon: 'today-outline',
    matchPaths: ['/', '/(main)/(tabs)', '/(main)/(tabs)/index'],
  },
  {
    href: '/(main)/ingredients' as Href,
    label: 'Ingredients',
    icon: 'leaf-outline',
    matchPaths: ['/(main)/ingredients', '/ingredients', '/(main)/(tabs)/ingredients'],
  },
  {
    href: '/(main)/inventory' as Href,
    label: 'Pantry',
    icon: 'cube-outline',
    matchPaths: [
      '/(main)/(tabs)/pantry',
      '/pantry',
      '/(main)/inventory',
      '/inventory',
    ],
  },
  {
    href: '/(main)/recipes' as Href,
    label: 'Recipes',
    icon: 'book-outline',
    matchPaths: ['/(main)/(tabs)/recipes', '/recipes', '/(main)/recipes'],
  },
  {
    href: '/(main)/(tabs)/planner',
    label: 'Planner',
    icon: 'calendar-outline',
    matchPaths: ['/(main)/(tabs)/planner', '/planner'],
  },
  {
    href: '/(main)/(tabs)/shop',
    label: 'Shop',
    icon: 'cart-outline',
    matchPaths: ['/(main)/(tabs)/shop', '/shop'],
  },
  {
    href: '/(main)/(tabs)/finance' as Href,
    label: 'Finance',
    icon: 'wallet-outline',
    matchPaths: ['/(main)/(tabs)/finance', '/finance'],
  },
  {
    href: '/(main)/(tabs)/notes' as Href,
    label: 'Notes',
    icon: 'document-text-outline',
    matchPaths: ['/(main)/(tabs)/notes', '/notes'],
  },
];

export const SETTINGS_NAV_ITEM: NavItem = {
  href: '/(main)/settings',
  label: 'Settings',
  icon: 'settings-outline',
  matchPaths: ['/(main)/settings', '/settings'],
};

function isActive(pathname: string, item: NavItem) {
  if (item.label === 'Ingredients') {
    return pathname.includes('/ingredients');
  }
  if (item.label === 'Pantry') {
    return pathname.includes('/inventory') || pathname.includes('/pantry');
  }
  if (item.label === 'Recipes') {
    return pathname.includes('/recipes');
  }
  if (item.label === 'Notes') {
    return pathname.includes('/notes');
  }
  if (item.label === 'Finance') {
    return pathname.includes('/finance');
  }
  return item.matchPaths.some(
    (path) => pathname === path || pathname.endsWith(path.replace('/(main)', '')),
  );
}

export function DesktopSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const appVersion = Constants.expoConfig?.version ?? '0.0.0';

  const items = [...MAIN_NAV_ITEMS, SETTINGS_NAV_ITEM];

  return (
    <View
      className="h-full"
      style={{ width: SIDEBAR_WIDTH, backgroundColor: NAV_SIDEBAR.background }}>
      <View
        className="border-b px-4 py-4"
        style={{ borderBottomColor: NAV_SIDEBAR.border }}>
        <Text className="text-sm font-bold" style={{ color: NAV_SIDEBAR.text }}>
          Grip Kitchen
        </Text>
        <Text className="text-xs" style={{ color: NAV_SIDEBAR.textMuted }}>
          Plan. Cook. Shop.
        </Text>
      </View>

      <View className="flex-1 px-2 py-3">
        {items.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              onPress={() => router.push(item.href)}
              className="mb-0.5 flex-row items-center rounded-card py-2 pl-2 pr-2"
              style={{
                backgroundColor: active ? NAV_SIDEBAR.backgroundActive : 'transparent',
                borderLeftWidth: active ? 3 : 0,
                borderLeftColor: active ? NAV_SIDEBAR.accent : 'transparent',
              }}>
              <Ionicons
                name={item.icon}
                size={16}
                color={active ? NAV_SIDEBAR.accent : NAV_SIDEBAR.textMuted}
              />
              <Text
                className="ml-2.5 text-xs"
                style={{
                  color: active ? NAV_SIDEBAR.text : NAV_SIDEBAR.textMuted,
                  fontWeight: active ? '600' : '400',
                }}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View
        className="border-t px-4 py-3"
        style={{ borderTopColor: NAV_SIDEBAR.border }}>
        <Text className="text-[10px]" style={{ color: NAV_SIDEBAR.textMuted }}>
          v{appVersion}
        </Text>
      </View>
    </View>
  );
}
