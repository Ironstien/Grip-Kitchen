import { Pressable, PressableProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/cn';

type IconButtonProps = PressableProps & {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  className?: string;
  iconColor?: string;
};

export function IconButton({
  name,
  size = 18,
  className,
  iconColor,
  ...props
}: IconButtonProps) {
  const { palette } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        'h-8 w-8 items-center justify-center rounded-button active:opacity-70',
        className,
      )}
      {...props}>
      <Ionicons name={name} size={size} color={iconColor ?? palette.text} />
    </Pressable>
  );
}
