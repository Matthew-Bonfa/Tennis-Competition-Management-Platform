import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

import RubberRow from './RubberRow';
import { clientErrors, toPayload } from '../../lib/scoresheet';
import type { ResultForm, RubberDraft, ScoresheetPayload } from './types';

interface ScoresheetFormProps {
  form: ResultForm;
  initial: RubberDraft[];
  // A player's sheet waits for the other team to confirm it; an admin's is final
  mode: 'player' | 'admin';
  teamNames: { home: string; away: string };
  // Errors from the server, already split by rubber number
  serverErrors?: { byRubber: Map<number, string[]>; general: string[] };
  submitting: boolean;
  onSubmit: (payload: ScoresheetPayload, note?: string) => void;
}

function ScoresheetForm({ form, initial, mode, teamNames, serverErrors, submitting, onSubmit }: ScoresheetFormProps) {
  const [drafts, setDrafts] = useState<RubberDraft[]>(initial);
  const [note, setNote] = useState('');
  // Quick checks only show once the user has tried to submit, so an empty form isn't covered in errors
  const [attempted, setAttempted] = useState(false);

  const localErrors = attempted ? clientErrors(drafts, form.format) : new Map<number, string[]>();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttempted(true);
    if (clientErrors(drafts, form.format).size > 0) {
      return;
    }
    onSubmit(toPayload(drafts, form.format), mode === 'admin' ? note.trim() || undefined : undefined);
  }

  function updateDraft(updated: RubberDraft) {
    setDrafts((current) => current.map((d) => (d.rubberNumber === updated.rubberNumber ? updated : d)));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <p className="text-sm text-ink-muted">
        {mode === 'player'
          ? 'The other team will be asked to confirm this result before it counts.'
          : 'This completes the match straight away, and replaces any result already saved.'}
      </p>

      {serverErrors && serverErrors.general.length > 0 && (
        <ul className="rounded-md border border-danger-border bg-danger-bg p-3 text-sm text-danger space-y-1" role="alert">
          {serverErrors.general.map((error, i) => (
            <li key={i}>{error}</li>
          ))}
        </ul>
      )}

      {drafts.map((draft) => (
        <RubberRow
          key={draft.rubberNumber}
          draft={draft}
          form={form}
          teamNames={teamNames}
          errors={[
            ...(localErrors.get(draft.rubberNumber) ?? []),
            ...(serverErrors?.byRubber.get(draft.rubberNumber) ?? []),
          ]}
          onChange={updateDraft}
        />
      ))}

      {mode === 'admin' && (
        <label className="block text-sm text-ink-muted">
          Note (optional)
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Why is the result being entered or changed?"
            className="mt-1 w-full rounded-md border border-border-strong px-3 py-2 text-ink"
          />
        </label>
      )}

      {attempted && localErrors.size > 0 && (
        <p className="text-sm text-danger" role="alert">Fix the problems above before submitting.</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {mode === 'player' ? 'Submit result' : 'Save result'}
        </button>
      </div>
    </form>
  );
}

export default ScoresheetForm;
