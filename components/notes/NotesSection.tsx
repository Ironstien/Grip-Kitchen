import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotes } from '@/hooks/useNotes';

export function NotesSection() {
  const { palette } = useTheme();
  const { notes, addNote, deleteNote } = useNotes();
  const [draft, setDraft] = useState('');

  const handleAdd = () => {
    if (addNote(draft)) {
      setDraft('');
    }
  };

  return (
    <View className="flex-1">
      <TextInput
        value={draft}
        onChangeText={setDraft}
        placeholder="Type a note..."
        placeholderTextColor={palette.textMuted}
        multiline
        returnKeyType="done"
        onSubmitEditing={handleAdd}
        className="mb-3 min-h-[80px] rounded-card px-3 py-2 text-sm text-text dark:text-text-dark"
        style={{
          backgroundColor: palette.background,
          borderWidth: 1,
          borderColor: palette.border,
        }}
      />

      <Button label="Add" onPress={handleAdd} disabled={!draft.trim()} className="self-start" />

      <ScrollView
        className="mt-4 flex-1"
        contentContainerClassName="gap-2 pb-2"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {notes.length === 0 ? (
          <Text variant="bodySecondary">No notes yet.</Text>
        ) : (
          notes.map((note) => (
            <View
              key={note.id}
              className="flex-row items-start rounded-card border border-border px-3 py-2 dark:border-border-dark"
              style={{ backgroundColor: palette.backgroundSecondary }}>
              <Text className="flex-1 text-sm leading-5 text-text dark:text-text-dark">
                {note.text}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete note"
                onPress={() => deleteNote(note.id)}
                hitSlop={8}
                className="ml-1.5 p-0.5 active:opacity-70">
                <Ionicons name="close" size={18} color={palette.textSecondary} />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
