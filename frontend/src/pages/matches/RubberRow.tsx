import type { OutcomeType, ResultForm, RosterPlayer, RubberDraft, SetDraft } from './types';
import {
  OUTCOME_LABELS, hasSets, isMatchTiebreakSet, isStopped, isTiebreakScore, needsWinner,
} from '../../lib/scoresheet';

interface RubberRowProps {
  draft: RubberDraft;
  form: ResultForm;
  teamNames: { home: string; away: string };
  errors: string[];
  onChange: (draft: RubberDraft) => void;
}

const RUBBER_TYPE_LABELS = {
  singles: 'Singles',
  doubles: 'Doubles',
  mixed_doubles: 'Mixed doubles',
};

const inputClass = 'min-h-11 rounded-lg border border-border-strong bg-surface px-2 py-1.5 text-ink focus:outline-none focus:ring-2 focus:ring-primary-500';
const scoreClass = `${inputClass} w-16 text-center`;
const tiebreakClass = 'min-h-11 rounded-lg border border-border-strong bg-surface px-1 py-1 text-ink w-12 text-center focus:outline-none focus:ring-2 focus:ring-primary-500';

function RubberRow({ draft, form, teamNames, errors, onChange }: RubberRowProps) {
  function setPlayer(side: 'home' | 'away', slot: number, personId: string) {
    const key = side === 'home' ? 'homePlayerIds' : 'awayPlayerIds';
    const next = [...draft[key]];
    next[slot] = personId;
    onChange({ ...draft, [key]: next });
  }

  function setOutcome(outcomeType: OutcomeType) {
    // The winner is only claimed for a retirement or walkover, so drop it for any other outcome
    onChange({ ...draft, outcomeType, winner: needsWinner(outcomeType) ? draft.winner : '' });
  }

  function setSet(index: number, patch: Partial<SetDraft>) {
    const sets = draft.sets.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onChange({ ...draft, sets });
  }

  function playerSelects(side: 'home' | 'away') {
    const roster: RosterPlayer[] = side === 'home' ? form.homeTeam.players : form.awayTeam.players;
    const picked = side === 'home' ? draft.homePlayerIds : draft.awayPlayerIds;

    return picked.map((personId, slot) => (
      <select
        key={slot}
        value={personId}
        onChange={(e) => setPlayer(side, slot, e.target.value)}
        aria-label={`Rubber ${draft.rubberNumber} ${side} player ${slot + 1}`}
        className={`${inputClass} w-full`}
      >
        <option value="">Select player</option>
        {roster
          // a player can't fill both slots of the same pair
          .filter((p) => p.personId === personId || !picked.includes(p.personId))
          .map((p) => (
            <option key={p.personId} value={p.personId}>
              {p.firstName} {p.lastName}
            </option>
          ))}
      </select>
    ));
  }

  const showSets = hasSets(draft.outcomeType);

  return (
    <div className="bg-surface border border-border rounded-lg p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="font-semibold text-ink">
          Rubber {draft.rubberNumber}
          <span className="text-ink-subtle font-normal"> · {RUBBER_TYPE_LABELS[draft.rubberType]}</span>
        </h2>
        <select
          value={draft.outcomeType}
          onChange={(e) => setOutcome(e.target.value as OutcomeType)}
          aria-label={`Rubber ${draft.rubberNumber} outcome`}
          className={inputClass}
        >
          {(Object.keys(OUTCOME_LABELS) as OutcomeType[]).map((outcome) => (
            <option key={outcome} value={outcome}>{OUTCOME_LABELS[outcome]}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-ink-subtle">{teamNames.home}</p>
          {playerSelects('home')}
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-ink-subtle">{teamNames.away}</p>
          {playerSelects('away')}
        </div>
      </div>

      {needsWinner(draft.outcomeType) && (
        <label className="block text-sm text-ink-muted mb-4">
          Winner
          <select
            value={draft.winner}
            onChange={(e) => onChange({ ...draft, winner: e.target.value as RubberDraft['winner'] })}
            className={`${inputClass} mt-1 w-full`}
          >
            <option value="">Select winner</option>
            <option value="home">{teamNames.home}</option>
            <option value="away">{teamNames.away}</option>
          </select>
        </label>
      )}

      {showSets && (
        <div className="space-y-2">
          {draft.sets.map((set, index) => {
            const matchTiebreak = isMatchTiebreakSet(form.format, index);
            const optional = index >= form.format.setsToWin;
            const label = matchTiebreak ? 'Match tiebreak' : `Set ${index + 1}`;
            const games = [Number(set.home), Number(set.away)];
            const showTiebreakPoints =
              !matchTiebreak &&
              set.home !== '' && set.away !== '' &&
              isTiebreakScore(form.format, games[0], games[1]);

            return (
              <div key={index} className="flex flex-wrap items-center gap-2">
                <span className="w-32 text-sm text-ink-muted">
                  {label}
                  {optional && <span className="text-ink-subtle"> (if played)</span>}
                </span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={set.home}
                  onChange={(e) => setSet(index, { home: e.target.value })}
                  aria-label={`Rubber ${draft.rubberNumber} ${label} home ${matchTiebreak ? 'points' : 'games'}`}
                  className={scoreClass}
                />
                <span className="text-ink-subtle">–</span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={set.away}
                  onChange={(e) => setSet(index, { away: e.target.value })}
                  aria-label={`Rubber ${draft.rubberNumber} ${label} away ${matchTiebreak ? 'points' : 'games'}`}
                  className={scoreClass}
                />
                {showTiebreakPoints && (
                  <span className="flex items-center gap-1 text-xs text-ink-subtle">
                    tiebreak
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={set.homeTb}
                      onChange={(e) => setSet(index, { homeTb: e.target.value })}
                      aria-label={`Rubber ${draft.rubberNumber} ${label} home tiebreak points`}
                      className={tiebreakClass}
                    />
                    –
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={set.awayTb}
                      onChange={(e) => setSet(index, { awayTb: e.target.value })}
                      aria-label={`Rubber ${draft.rubberNumber} ${label} away tiebreak points`}
                      className={tiebreakClass}
                    />
                  </span>
                )}
              </div>
            );
          })}
          {isStopped(draft.outcomeType) && (
            <p className="text-xs text-ink-subtle">
              Enter the sets played. The last one you fill in is counted as unfinished.
            </p>
          )}
        </div>
      )}

      {errors.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm text-danger" role="alert">
          {errors.map((error, i) => (
            <li key={i}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RubberRow;
