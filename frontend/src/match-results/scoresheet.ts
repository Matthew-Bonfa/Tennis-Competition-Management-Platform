import type {
  FormatRules, MatchWithRubbers, OutcomeType, ResultForm, RubberDraft, ScoresheetPayload, SetDraft,
} from './types';

const NO_SETS: OutcomeType[] = ['walkover', 'not_played'];
const STOPPED: OutcomeType[] = ['retired', 'incomplete'];
const CLAIMED_WINNER: OutcomeType[] = ['retired', 'walkover'];

export const OUTCOME_LABELS: Record<OutcomeType, string> = {
  normal: 'Completed',
  retired: 'Retired',
  walkover: 'Walkover',
  incomplete: 'Incomplete',
  not_played: 'Not played',
};

const emptySet = (): SetDraft => ({ home: '', away: '', homeTb: '', awayTb: '' });

export const maxSets = (format: FormatRules) => format.setsToWin * 2 - 1;
export const needsWinner = (outcome: OutcomeType) => CLAIMED_WINNER.includes(outcome);
export const hasSets = (outcome: OutcomeType) => !NO_SETS.includes(outcome);
export const isStopped = (outcome: OutcomeType) => STOPPED.includes(outcome);

// The deciding set is played as a match tiebreak in some formats
export const isMatchTiebreakSet = (format: FormatRules, index: number) =>
  format.finalSetMatchTiebreak && index === maxSets(format) - 1;

// A score like 7-6 is a set decided by a tiebreak, so the tiebreak points are needed too
export function isTiebreakScore(format: FormatRules, home: number, away: number) {
  const at = format.tiebreakAtGames;
  return at !== null && ((home === at + 1 && away === at) || (away === at + 1 && home === at));
}

const playersNeeded = (rubberType: RubberDraft['rubberType']) => (rubberType === 'singles' ? 1 : 2);

export function emptyDraft(form: ResultForm): RubberDraft[] {
  return form.rubbers.map((r) => ({
    rubberNumber: r.rubberNumber,
    rubberType: r.rubberType,
    outcomeType: 'normal',
    winner: '',
    homePlayerIds: Array(playersNeeded(r.rubberType)).fill(''),
    awayPlayerIds: Array(playersNeeded(r.rubberType)).fill(''),
    sets: Array.from({ length: maxSets(form.format) }, emptySet),
  }));
}

// Fills the form from the sheet already saved on the match, so re-entering after
// a dispute (or an admin correcting a result) starts from what is there
export function draftFromMatch(match: MatchWithRubbers, form: ResultForm): RubberDraft[] {
  const blank = emptyDraft(form);
  const total = maxSets(form.format);

  return blank.map((draft) => {
    const saved = match.rubbers.find((r) => r.rubberNumber === draft.rubberNumber);
    if (!saved) {
      return draft;
    }

    const pick = (teamId: number, slots: number) => {
      const ids = saved.players.filter((p) => p.teamId === teamId).map((p) => p.personId);
      return Array.from({ length: slots }, (_, i) => ids[i] ?? '');
    };

    const sets: SetDraft[] = [...saved.sets]
      .sort((a, b) => a.setNumber - b.setNumber)
      .map((s) =>
        s.isMatchTiebreak
          ? { home: String(s.homeTiebreakPoints ?? ''), away: String(s.awayTiebreakPoints ?? ''), homeTb: '', awayTb: '' }
          : {
              home: String(s.homeGames),
              away: String(s.awayGames),
              homeTb: s.homeTiebreakPoints === null ? '' : String(s.homeTiebreakPoints),
              awayTb: s.awayTiebreakPoints === null ? '' : String(s.awayTiebreakPoints),
            },
      );
    while (sets.length < total) {
      sets.push(emptySet());
    }

    let winner: RubberDraft['winner'] = '';
    if (needsWinner(saved.outcomeType)) {
      winner = saved.winningTeamId === match.homeTeam.id ? 'home' : saved.winningTeamId === match.awayTeam.id ? 'away' : '';
    }

    return {
      ...draft,
      outcomeType: saved.outcomeType,
      winner,
      homePlayerIds: pick(match.homeTeam.id, draft.homePlayerIds.length),
      awayPlayerIds: pick(match.awayTeam.id, draft.awayPlayerIds.length),
      sets,
    };
  });
}

const isCount = (value: string) => value.trim() !== '' && Number.isInteger(Number(value)) && Number(value) >= 0;
const isBlank = (set: SetDraft) => set.home === '' && set.away === '' && set.homeTb === '' && set.awayTb === '';

// The sets that were filled in, in order. Anything after the first empty row is left out
function filledSets(draft: RubberDraft) {
  if (!hasSets(draft.outcomeType)) {
    return [];
  }
  const firstBlank = draft.sets.findIndex(isBlank);
  return firstBlank === -1 ? draft.sets : draft.sets.slice(0, firstBlank);
}

// Quick checks so obvious slips show up before a round trip. The score rules
// themselves are only checked by the server, so there is a single copy of them.
// Returns problems keyed by rubber number.
export function clientErrors(drafts: RubberDraft[], format: FormatRules): Map<number, string[]> {
  const problems = new Map<number, string[]>();

  for (const draft of drafts) {
    const errors: string[] = [];
    const outcome = draft.outcomeType;

    if (outcome !== 'walkover' && outcome !== 'not_played') {
      if (draft.homePlayerIds.some((id) => !id) || draft.awayPlayerIds.some((id) => !id)) {
        errors.push('Pick every player');
      }
    }

    const both = [...draft.homePlayerIds, ...draft.awayPlayerIds].filter(Boolean);
    if (new Set(both).size !== both.length) {
      errors.push('A player is picked more than once');
    }

    if (needsWinner(outcome) && !draft.winner) {
      errors.push('Pick the winner');
    }

    if (hasSets(outcome)) {
      const sets = filledSets(draft);
      const rowsAfterGap = draft.sets.slice(sets.length).some((s) => !isBlank(s));
      if (rowsAfterGap) {
        errors.push('There is an empty set between the sets entered');
      }
      if (sets.length === 0) {
        errors.push('Enter at least one set');
      }

      sets.forEach((set, i) => {
        const label = isMatchTiebreakSet(format, i) ? 'Match tiebreak' : `Set ${i + 1}`;
        if (!isCount(set.home) || !isCount(set.away)) {
          errors.push(`${label}: enter a score for both sides`);
          return;
        }
        const unfinished = isStopped(outcome) && i === sets.length - 1;
        if (!isMatchTiebreakSet(format, i) && !unfinished && isTiebreakScore(format, Number(set.home), Number(set.away))) {
          if (!isCount(set.homeTb) || !isCount(set.awayTb)) {
            errors.push(`${label}: enter the tiebreak points`);
          }
        }
      });
    }

    if (errors.length > 0) {
      problems.set(draft.rubberNumber, errors);
    }
  }

  return problems;
}

// Turns the form into the request body. The server still validates the whole
// sheet and decides every winner; this only reshapes what was typed.
export function toPayload(drafts: RubberDraft[], format: FormatRules): ScoresheetPayload {
  return {
    rubbers: drafts.map((draft) => {
      const entered = filledSets(draft);
      const stopped = isStopped(draft.outcomeType);

      const sets = entered.map((set, i) => {
        const unfinished = stopped && i === entered.length - 1;
        const home = Number(set.home);
        const away = Number(set.away);

        if (isMatchTiebreakSet(format, i)) {
          // A match tiebreak is saved as a 1-0 set with the points kept separately.
          // If play stopped partway through it, no game is awarded.
          return {
            setNumber: i + 1,
            homeGames: unfinished ? 0 : home > away ? 1 : 0,
            awayGames: unfinished ? 0 : away > home ? 1 : 0,
            homeTiebreakPoints: home,
            awayTiebreakPoints: away,
            isMatchTiebreak: true,
            isComplete: !unfinished,
          };
        }

        const hasTiebreakPoints = isCount(set.homeTb) && isCount(set.awayTb);
        const tiebreak = isTiebreakScore(format, home, away) && hasTiebreakPoints;
        return {
          setNumber: i + 1,
          homeGames: home,
          awayGames: away,
          homeTiebreakPoints: tiebreak ? Number(set.homeTb) : null,
          awayTiebreakPoints: tiebreak ? Number(set.awayTb) : null,
          isMatchTiebreak: false,
          isComplete: !unfinished,
        };
      });

      return {
        rubberNumber: draft.rubberNumber,
        outcomeType: draft.outcomeType,
        // Only a retirement or walkover carries a claimed winner; the server rejects it otherwise
        ...(needsWinner(draft.outcomeType) && draft.winner ? { winner: draft.winner } : {}),
        homePlayerIds: draft.homePlayerIds.filter(Boolean),
        awayPlayerIds: draft.awayPlayerIds.filter(Boolean),
        sets,
      };
    }),
  };
}

// The scoresheet 400 has errors like "Rubber 3: Illegal set score: 8-2", while the
// ValidationPipe 400 has a message list instead. Splits them by rubber so each
// can show under its own card.
export function splitErrors(body: unknown) {
  const source = body as { errors?: string[]; message?: string | string[] } | null;
  const list: string[] = source?.errors ?? [].concat((source?.message ?? 'Something went wrong') as never);

  const byRubber = new Map<number, string[]>();
  const general: string[] = [];
  for (const error of list) {
    const match = /^Rubber (\d+): (.*)$/.exec(error);
    if (match) {
      const number = Number(match[1]);
      byRubber.set(number, [...(byRubber.get(number) ?? []), match[2]]);
    } else {
      general.push(error);
    }
  }
  return { byRubber, general };
}
