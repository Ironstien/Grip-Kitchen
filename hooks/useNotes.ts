import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';

export type Note = {
  id: string;
  text: string;
  createdAt: string;
};

function getNotesStorageKey(userId: string | undefined) {
  return userId ? `grip-kitchen-notes-${userId}` : 'grip-kitchen-notes';
}

function createNoteId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setHydrated(false);
    setNotes([]);

    AsyncStorage.getItem(getNotesStorageKey(user?.id))
      .then((stored) => {
        if (cancelled || !stored) {
          return;
        }

        const parsed = JSON.parse(stored) as Note[];
        if (Array.isArray(parsed)) {
          setNotes(parsed);
        }
      })
      .catch((error) => {
        console.error('Failed to load notes', error);
      })
      .finally(() => {
        if (!cancelled) {
          setHydrated(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const persistNotes = useCallback(
    (nextNotes: Note[]) => {
      setNotes(nextNotes);
      void AsyncStorage.setItem(getNotesStorageKey(user?.id), JSON.stringify(nextNotes));
    },
    [user?.id],
  );

  const addNote = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) {
        return false;
      }

      const nextNote: Note = {
        id: createNoteId(),
        text: trimmed,
        createdAt: new Date().toISOString(),
      };

      persistNotes([nextNote, ...notes]);
      return true;
    },
    [notes, persistNotes],
  );

  const deleteNote = useCallback(
    (id: string) => {
      persistNotes(notes.filter((note) => note.id !== id));
    },
    [notes, persistNotes],
  );

  return {
    notes,
    hydrated,
    addNote,
    deleteNote,
  };
}
