import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { NotesSection } from '@/components/notes/NotesSection';
import { Heading, Text } from '@/components/ui/Text';
import { detailPaddingClass, pageHeaderMarginClass, pagePaddingClass } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

export default function NotesScreen() {
  const { isDesktop } = useResponsive();
  const paddingClass = pagePaddingClass(isDesktop);

  const content = (
    <>
      <View className={pageHeaderMarginClass(isDesktop)}>
        <Heading level={2}>Notes</Heading>
        <Text variant="caption" className="mt-0.5">
          Jot down quick reminders while you cook and shop.
        </Text>
      </View>

      <NotesSection />
    </>
  );

  if (isDesktop) {
    return (
      <ScrollView
        className="flex-1 bg-surface dark:bg-surface-dark"
        contentContainerClassName={`${detailPaddingClass(true)} max-w-2xl flex-grow pb-8`}>
        {content}
      </ScrollView>
    );
  }

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
        <NotesSection />
      </View>
    </KeyboardAvoidingView>
  );
}
