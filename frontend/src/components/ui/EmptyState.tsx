import type { ReactNode } from 'react';

/* The "nothing to show" counterpart to LoadingState: one bordered surface with a centred
   message, so every empty list looks the same instead of each page inventing its own
   combination of border, background and padding. */
interface EmptyStateProps {
  children: ReactNode;
}

function EmptyState({ children }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-border bg-surface px-6 py-12 text-center text-sm text-ink-subtle">
      {children}
    </div>
  );
}

export default EmptyState;
