import { cn } from '@/lib/cn';

/** Shared surface styling for inputs, selects, and interactive field controls. */
export const fieldSurfaceClassName = cn(
  'rounded-button border border-field-border bg-field shadow-field',
  'dark:border-field-dark-border dark:bg-field-dark dark:shadow-none',
);

/** Panel styling for grouped form sections (ingredient rows, field groups). */
export const fieldPanelClassName = cn(
  'rounded-card border border-border bg-surface-secondary p-3 shadow-panel',
  'dark:border-border-dark dark:bg-surface-dark-secondary',
);
