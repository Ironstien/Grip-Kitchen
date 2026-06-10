type PostgresErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

export function formatErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    const pgError = error as PostgresErrorLike;

    if (pgError.code === '23505') {
      return 'An ingredient with this name already exists.';
    }

    if (pgError.code === '23503') {
      return 'Your account profile is not set up yet. Try signing out and back in.';
    }

    if (
      pgError.code === '42P01' ||
      pgError.code === 'PGRST205' ||
      pgError.message?.includes('does not exist') ||
      pgError.message?.includes('schema cache')
    ) {
      return 'Database is missing the ingredients table. In Supabase → SQL Editor, run supabase/migrations/005_ingredients_master_list.sql';
    }

    if (typeof pgError.message === 'string' && pgError.message.length > 0) {
      return pgError.message;
    }
  }

  return fallback;
}

export function toError(error: unknown, fallback = 'Something went wrong.'): Error {
  return new Error(formatErrorMessage(error, fallback));
}
