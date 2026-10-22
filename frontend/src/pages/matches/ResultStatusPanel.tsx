import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Loader2, PencilLine, X } from 'lucide-react';

import fetchApi, { ApiError, postApi } from '../../lib/api';
import { isAuthenticated } from '../../lib/auth';
import type { ResultForm } from './types';

interface ResultStatusPanelProps {
  match: any;
  // Confirming or disputing returns the updated match, so the page can show it without reloading
  onMatchChange: (match: any) => void;
}

function errorMessage(err: ApiError) {
  const message = err.body && typeof err.body === 'object' && 'message' in err.body ? err.body.message : null;
  return Array.isArray(message) ? message.join(', ') : String(message ?? 'Something went wrong');
}

function ResultStatusPanel({ match, onMatchChange }: ResultStatusPanelProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState<ResultForm | null>(null);
  const [disputing, setDisputing] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<'confirm' | 'dispute' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Signed-out visitors must not call this: fetchApi sends a 401 straight to /login
    if (!isAuthenticated()) {
      return;
    }

    fetchApi(`/matches/${match.id}/result-form`)
      .then(setForm)
      .catch((err) => {
        // viewer isn't a player in this match or an admin
        if (!(err instanceof ApiError && err.status === 403)) {
          throw err;
        }
      });
  }, [match.id, match.matchStatus]);

  // A dispute always opens the entry form next, so the disputer can enter the score they think is right
  async function respond(action: 'confirm' | 'dispute') {
    setBusy(action);
    setError(null);
    try {
      const updated = await postApi(`/matches/${match.id}/${action}`, action === 'dispute' ? { reason: reason.trim() } : {});
      setDisputing(false);
      setReason('');
      onMatchChange(updated);
      if (action === 'dispute') {
        navigate(`/matches/${match.id}/enter`);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(errorMessage(err));
      } else {
        throw err;
      }
    } finally {
      setBusy(null);
    }
  }

  const status: string = match.matchStatus;
  const isPlayer = !!form?.viewerSide;
  const isAdmin = form !== null && form.viewerSide === null;
  const canRespond =
    status === 'awaiting_confirmation' && isPlayer && form!.viewerSide !== form!.enteredBySide;
  const canEnter = isPlayer && ['scheduled', 'disputed'].includes(status);

  // The team that still has to answer
  const waitingOn = form?.enteredBySide === 'home' ? match.awayTeam.name : match.homeTeam.name;

  const linkClass =
    'inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700';

  if (status === 'completed' && !isAdmin) {
    return null;
  }

  return (
    <div className="space-y-3 mb-4">
      {status === 'awaiting_confirmation' && (
        <div className="rounded-md border border-warning-border bg-warning-bg p-3 text-sm text-warning">
          <p className="font-semibold">Awaiting confirmation</p>
          <p className="mt-1">
            {form?.enteredBySide
              ? `This result is provisional until ${waitingOn} confirms it.`
              : 'This result is provisional until the other team confirms it.'}
          </p>
        </div>
      )}

      {status === 'disputed' && (
        <div className="rounded-md border border-danger-border bg-danger-bg p-3 text-sm text-danger">
          <p className="font-semibold">Result disputed</p>
          {match.disputeReason && <p className="mt-1">Reason: {match.disputeReason}</p>}
          <p className="mt-1">The result needs to be entered again.</p>
        </div>
      )}

      {canRespond && !disputing && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => respond('confirm')}
            disabled={busy !== null}
            className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {busy === 'confirm' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Confirm result
          </button>
          <button
            type="button"
            onClick={() => setDisputing(true)}
            disabled={busy !== null}
            className="inline-flex items-center gap-1 rounded-lg border border-border-strong bg-muted px-3 py-1.5 text-sm font-medium text-ink hover:bg-border disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Dispute
          </button>
        </div>
      )}

      {canRespond && disputing && (
        <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
          <label className="block text-sm text-ink-muted">
            Why do you dispute this result? You will enter the correct score next.
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={3}
              className="mt-1 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </label>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setDisputing(false);
                setError(null);
              }}
              disabled={busy !== null}
              className="rounded-lg border border-border-strong bg-muted px-3 py-1.5 text-sm font-medium text-ink hover:bg-border"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => respond('dispute')}
              disabled={busy !== null || reason.trim() === ''}
              className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {busy === 'dispute' && <Loader2 className="h-4 w-4 animate-spin" />}
              Dispute and enter the correct score
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-danger" role="alert">{error}</p>}

      {canEnter && (
        <Link to={`/matches/${match.id}/enter`} className={linkClass}>
          <PencilLine className="h-4 w-4" />
          {status === 'disputed' ? 'Re-enter result' : 'Enter result'}
        </Link>
      )}

      {isAdmin && (
        <Link to={`/matches/${match.id}/enter`} className={linkClass}>
          <PencilLine className="h-4 w-4" />
          {status === 'scheduled' ? 'Enter result' : 'Edit result'}
        </Link>
      )}
    </div>
  );
}

export default ResultStatusPanel;
