import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/lib/queryKeys';
import { createNote, deleteNote as deleteNoteService, fetchNotes } from '@/lib/services/notes';

export function useNotes() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { data: notes = [], isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: queryKeys.notes,
    queryFn: fetchNotes,
    enabled: Boolean(session),
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.notes });
  }, [queryClient]);

  const addMutation = useMutation({
    mutationFn: createNote,
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNoteService,
    onSuccess: invalidate,
  });

  const addNote = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) {
        return false;
      }

      try {
        await addMutation.mutateAsync(trimmed);
        return true;
      } catch {
        return false;
      }
    },
    [addMutation],
  );

  const deleteNote = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation],
  );

  return {
    notes,
    isLoading: isLoading || isRefetching,
    isError,
    errorMessage: error instanceof Error ? error.message : null,
    isAdding: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
    addNote,
    deleteNote,
    refetch,
  };
}
