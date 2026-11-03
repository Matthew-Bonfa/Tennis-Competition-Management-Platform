// Shared guard rail for hard deletes. Every destructive action in the app goes
// through this dialog so they all feel the same and none can be triggered by a
// stray click: the Delete button stays disabled until the entity's exact name
// is typed into the box, and the dialog spells out what the cascade will take
// with it.
//
// Usage:
//   <ConfirmDeleteDialog
//     title="Delete season"
//     entityName={season.name}
//     consequences={['All of its sections', 'Every team and fixture in them']}
//     onDelete={doDelete}
//     onClose={() => setOpen(false)}
//   />

import { useEffect, useRef, useState } from 'react';

interface ConfirmDeleteDialogProps {
  /** The name the user must type exactly to arm the Delete button */
  entityName: string;
  title: string;
  /** What the cascade will permanently remove, shown as a bullet list */
  consequences: string[];
  /** Called once armed and confirmed. Rejections are shown inside the dialog. */
  onDelete: () => Promise<void>;
  onClose: () => void;
}

function ConfirmDeleteDialog({ entityName, title, consequences, onDelete, onClose }: ConfirmDeleteDialogProps) {
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const armed = confirmation.trim() === entityName;

  // Focus the typing box so the flow starts immediately; close on Escape
  useEffect(() => {
    inputRef.current?.focus();
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  async function handleDelete() {
    if (!armed || deleting) return;
    setDeleting(true);
    setError('');
    try {
      await onDelete();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'The delete failed. Nothing else was changed — try again.');
      setDeleting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface rounded-lg shadow-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-delete-title" className="text-xl font-bold text-danger">
          {title}
        </h2>

        <p className="mt-2 text-sm text-ink-muted">
          This is permanent and cannot be undone. It will delete:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-ink">
          {consequences.map((line) => (
            <li key={line} className="flex gap-2">
              <span aria-hidden="true" className="text-danger">&bull;</span>
              {line}
            </li>
          ))}
        </ul>

        <p className="mt-4 text-sm text-ink-muted">
          To confirm, type the name exactly:
        </p>
        <p className="mt-1 text-sm font-medium text-ink">&ldquo;{entityName}&rdquo;</p>
        <input
          ref={inputRef}
          type="text"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleDelete()}
          aria-label="Confirmation text"
          autoComplete="off"
          className="mt-2 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-danger"
        />

        {error && (
          <div role="alert" className="mt-3 rounded-md border border-danger-border bg-danger-bg p-3 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="min-h-11 rounded-lg border border-border-strong bg-surface px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-canvas disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!armed || deleting}
            className="min-h-11 rounded-lg bg-danger px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteDialog;
