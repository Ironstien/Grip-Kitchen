import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { NotesSection } from '@/components/notes/NotesSection';
import { Heading, Text } from '@/components/ui/Text';
import { pageHeaderMarginClass, pagePaddingClass } from '@/constants/theme';

export default function NotesScreen() {
  const paddingClass = pagePaddingClass(false);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface dark:bg-surface-dark"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View className={`border-b border-border dark:border-border-dark ${paddingClass} pb-3`}>
        <View className={pageHeaderMarginClass(false)}>
          <Heading level={2}>Notes</Heading>
          <Text variant="caption" className="mt-0.5">
            Jot down quick reminders while you cook and shop.
          </Text>
        </View>
      </View>

      <View className={`flex-1 ${paddingClass}`}>
        <NotesSection variant="page" />
      </View>
    </KeyboardAvoidingView>
  );
}
