import { Ionicons } from '@expo/vector-icons';
import { Href, usePathname, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/contexts/ThemeContext';

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
    href: '/(main)/(tabs)/pantry',
    label: 'Pantry',
    icon: 'cube-outline',
    matchPaths: ['/(main)/(tabs)/pantry', '/pantry'],
  },
  {
    href: '/(main)/(tabs)/recipes',
    label: 'Recipes',
    icon: 'book-outline',
    matchPaths: ['/(main)/(tabs)/recipes', '/recipes'],
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
];

export const SETTINGS_NAV_ITEM: NavItem = {
  href: '/(main)/settings',
  label: 'Settings',
  icon: 'settings-outline',
  matchPaths: ['/(main)/settings', '/settings'],
};

function isActive(pathname: string, item: NavItem) {
  return item.matchPaths.some((path) => pathname === path || pathname.endsWith(path.replace('/(main)', '')));
}

export function DesktopSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { palette } = useTheme();

  const items = [...MAIN_NAV_ITEMS, SETTINGS_NAV_ITEM];

  return (
    <View
      className="h-full w-[240px] border-r border-border bg-surface-secondary dark:border-border-dark dark:bg-[#141414]"
      style={{ backgroundColor: palette.sidebar }}>
      <View className="border-b border-border px-5 py-6 dark:border-border-dark">
        <Text className="text-lg font-bold text-text dark:text-text-dark">Grip Kitchen</Text>
        <Text variant="caption">Plan. Cook. Shop.</Text>
      </View>

      <View className="flex-1 px-3 py-4">
        {items.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              onPress={() => router.push(item.href)}
              className={`mb-1 flex-row items-center rounded-card px-3 py-3 ${
                active ? 'bg-black/5 dark:bg-white/10' : ''
              }`}>
              <Ionicons
                name={item.icon}
                size={20}
                color={active ? palette.brand : palette.textSecondary}
              />
              <Text
                className={`ml-3 text-sm ${
                  active
                    ? 'font-semibold text-text dark:text-text-dark'
                    : 'text-text-secondary dark:text-text-dark-secondary'
                }`}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
