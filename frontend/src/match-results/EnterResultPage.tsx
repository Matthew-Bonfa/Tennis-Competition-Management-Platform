import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import fetchApi, { ApiError, postApi, putApi } from '../api';
import { isAuthenticated } from '../auth';
import ScoresheetForm from './ScoresheetForm';
import { draftFromMatch, emptyDraft, splitErrors } from './scoresheet';
import type { ResultForm, ScoresheetPayload } from './types';

// Players can enter a result before it's played out or after a dispute;
// admins can also replace one that's waiting or already confirmed
const PLAYER_STATUSES = ['scheduled', 'disputed'];
const ADMIN_STATUSES = ['scheduled', 'disputed', 'awaiting_confirmation', 'completed'];

type LoadState = 'loading' | 'ready' | 'notFound' | 'forbidden';

function EnterResultPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState<LoadState>('loading');
  const [form, setForm] = useState<ResultForm | null>(null);
  const [match, setMatch] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<ReturnType<typeof splitErrors> | undefined>();

  useEffect(() => {
    // Signed-out visitors must not call the API: fetchApi sends a 401 straight to /login
    if (!isAuthenticated()) {
      return;
    }

    async function load() {
      try {
        const [resultForm, matchData] = await Promise.all([
          fetchApi(`/matches/${matchId}/result-form`),
          fetchApi(`/matches/${matchId}`),
        ]);
        setForm(resultForm);
        setMatch(matchData);
        setState('ready');
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setState('notFound');
        } else if (err instanceof ApiError && err.status === 403) {
          setState('forbidden');
        } else {
          throw err;
        }
      }
    }

    load();
  }, [matchId]);

  async function handleSubmit(payload: ScoresheetPayload, note?: string) {
    setSubmitting(true);
    setServerErrors(undefined);
    try {
      if (form!.viewerSide === null) {
        await putApi(`/matches/${matchId}/result`, { ...payload, note });
      } else {
        await postApi(`/matches/${matchId}/result`, payload);
      }
      navigate(`/matches/${matchId}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerErrors(splitErrors(err.body));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw err;
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAuthenticated()) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="space-y-4 bg-white p-8 rounded-lg shadow text-center">
          <h2 className="text-2xl font-bold text-gray-900">Please Sign In</h2>
          <p className="text-sm text-gray-600">Sign in to enter a match result.</p>
          <Link to="/login" className="block w-full rounded bg-sky-600 py-2 font-medium text-white hover:bg-sky-700">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (state === 'loading') {
    return <p className="max-w-3xl mx-auto px-4 py-12 text-gray-500">Loading...</p>;
  }

  const backLink = (
    <Link
      to={`/matches/${matchId}`}
      className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-sky-600 mb-6 transition-colors"
    >
      <ArrowLeft className="h-4 w-4" /> Back to match
    </Link>
  );

  if (state === 'notFound' || state === 'forbidden' || !form || !match) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-600 mb-4">
          {state === 'notFound'
            ? 'Match not found.'
            : 'Only players from the two teams, or an association admin, can enter this result.'}
        </p>
        <Link to={`/matches/${matchId}`} className="text-sky-600 hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to match
        </Link>
      </div>
    );
  }

  const isAdmin = form.viewerSide === null;
  const allowed = (isAdmin ? ADMIN_STATUSES : PLAYER_STATUSES).includes(form.matchStatus);
  const teamNames = { home: match.homeTeam.name, away: match.awayTeam.name };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {backLink}

      <h1 className="text-xl font-bold text-gray-900">
        {teamNames.home} v {teamNames.away}
      </h1>
      <p className="text-sm text-gray-500 mb-6">Round {match.roundNumber}</p>

      {!allowed ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-gray-600">
          {form.matchStatus === 'awaiting_confirmation'
            ? 'A result has been entered and is waiting for the other team to confirm it.'
            : form.matchStatus === 'completed'
              ? 'This result has already been confirmed. Ask an association admin if it needs changing.'
              : `A result can't be entered while the match is ${form.matchStatus.replace('_', ' ')}.`}
        </div>
      ) : (
        <>
          {form.matchStatus === 'disputed' && (
            <div className="rounded border border-amber-200 bg-amber-50 p-3 mb-4 text-sm text-amber-800">
              <p className="font-semibold">The other team disputed the last result.</p>
              {form.disputeReason && <p className="mt-1">Reason: {form.disputeReason}</p>}
            </div>
          )}

          <ScoresheetForm
            form={form}
            initial={match.rubbers.length > 0 ? draftFromMatch(match, form) : emptyDraft(form)}
            mode={isAdmin ? 'admin' : 'player'}
            teamNames={teamNames}
            serverErrors={serverErrors}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        </>
      )}
    </div>
  );
}

export default EnterResultPage;
