import { ensureUserProfile, tables } from '@/lib/database';
import { toError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import type { Note } from '@/types/database';

export async function fetchNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from(tables.notes)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw toError(error, 'Could not load notes.');
  }

  return data ?? [];
}

export async function createNote(text: string): Promise<Note> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Note text is required.');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  await ensureUserProfile();

  const { data, error } = await supabase
    .from(tables.notes)
    .insert({
      user_id: user.id,
      text: trimmed,
    })
    .select('*')
    .single();

  if (error) {
    throw toError(error, 'Could not add note.');
  }

  return data;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from(tables.notes).delete().eq('id', id);

  if (error) {
    throw toError(error, 'Could not delete note.');
  }
}
