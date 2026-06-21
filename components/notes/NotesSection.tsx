import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { NAV_SIDEBAR } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotes } from '@/hooks/useNotes';

type NotesSectionProps = {
  variant?: 'sidebar' | 'page';
};

export function NotesSection({ variant = 'page' }: NotesSectionProps) {
  const { palette } = useTheme();
  const { notes, addNote, deleteNote } = useNotes();
  const [draft, setDraft] = useState('');
  const isSidebar = variant === 'sidebar';

  const handleAdd = () => {
    if (addNote(draft)) {
      setDraft('');
    }
  };

  return (
    <View
      className={isSidebar ? 'border-t px-2 py-3' : 'flex-1'}
      style={isSidebar ? { borderTopColor: NAV_SIDEBAR.border, maxHeight: 220 } : undefined}>
      <Text
        className={isSidebar ? 'mb-2 px-2 text-[10px] font-semibold uppercase tracking-wide' : 'mb-3 text-sm font-semibold'}
        style={isSidebar ? { color: NAV_SIDEBAR.textMuted } : { color: palette.text }}>
        Notes
      </Text>

      <View className={isSidebar ? 'px-2' : undefined}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Type a note..."
          placeholderTextColor={isSidebar ? NAV_SIDEBAR.textMuted : palette.textMuted}
          multiline={!isSidebar}
          returnKeyType="done"
          onSubmitEditing={handleAdd}
          className={
            isSidebar
              ? 'mb-2 min-h-[32px] rounded-card px-2 py-1.5 text-xs'
              : 'mb-3 min-h-[80px] rounded-card px-3 py-2 text-sm text-text dark:text-text-dark'
          }
          style={
            isSidebar
              ? {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: NAV_SIDEBAR.text,
                  borderWidth: 1,
                  borderColor: NAV_SIDEBAR.border,
                }
              : {
                  backgroundColor: palette.background,
                  borderWidth: 1,
                  borderColor: palette.border,
                }
          }
        />

        <Button
          label="Add"
          onPress={handleAdd}
          disabled={!draft.trim()}
          className={isSidebar ? 'self-start px-3 py-1' : undefined}
          textClassName={isSidebar ? 'text-xs' : undefined}
        />
      </View>

      <ScrollView
        className={isSidebar ? 'mt-2 flex-1 px-2' : 'mt-4 flex-1'}
        contentContainerClassName="gap-2 pb-2"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {notes.length === 0 ? (
          <Text
            className={isSidebar ? 'px-1 text-[11px]' : 'text-sm'}
            style={isSidebar ? { color: NAV_SIDEBAR.textMuted } : { color: palette.textSecondary }}>
            No notes yet.
          </Text>
        ) : (
          notes.map((note) => (
            <View
              key={note.id}
              className={
                isSidebar
                  ? 'flex-row items-start rounded-card px-2 py-1.5'
                  : 'flex-row items-start rounded-card border border-border px-3 py-2 dark:border-border-dark'
              }
              style={
                isSidebar
                  ? { backgroundColor: 'rgba(255, 255, 255, 0.06)' }
                  : { backgroundColor: palette.backgroundSecondary }
              }>
              <Text
                className={isSidebar ? 'flex-1 text-[11px] leading-4' : 'flex-1 text-sm leading-5'}
                style={isSidebar ? { color: NAV_SIDEBAR.text } : { color: palette.text }}>
                {note.text}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete note"
                onPress={() => deleteNote(note.id)}
                hitSlop={8}
                className="ml-1.5 p-0.5 active:opacity-70">
                <Ionicons
                  name="close"
                  size={isSidebar ? 14 : 18}
                  color={isSidebar ? NAV_SIDEBAR.textMuted : palette.textSecondary}
                />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
