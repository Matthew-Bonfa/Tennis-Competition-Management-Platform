import { summariseRubber } from '../rubbers/summarise-rubber.js';
import type { OutcomeType, SetScore } from '../rubbers/types.js';
import { decideMatchWinner, decideWinner } from './decide-winner.js';
import type { Side, Tally, WinnerRule } from './decide-winner.js';
import type { LayoutRubber, RubberType, SubmittedRubber } from './validate-scoresheet.js';

// A rubber ready to be saved: the winner is decided and rubberType is copied
// from the format's layout, so editing a format later doesn't rewrite how past
// matches were played.
export interface ComputedRubber {
    rubberNumber: number;
    rubberType: RubberType;
    outcomeType: OutcomeType;
    winningTeamId: number | null;
    sets: Array<Required<Pick<SetScore, 'setNumber' | 'homeGames' | 'awayGames' | 'isMatchTiebreak' | 'isComplete'>> & {
        homeTiebreakPoints: number | null;
        awayTiebreakPoints: number | null;
    }>;
    homePlayerIds: string[];
    awayPlayerIds: string[];
}

export interface ComputedResult {
    rubbers: ComputedRubber[];
    // null means a draw
    winningTeamId: number | null;
}

// Turns a validated scoresheet into what gets saved. The server decides every
// winner here; the client only ever claims one for a retirement or walkover.
// Assumes validateScoresheet has already passed, so every rubber is in the layout.
export function computeResult(
    layout: LayoutRubber[],
    rubbers: SubmittedRubber[],
    homeTeamId: number,
    awayTeamId: number,
    rule: WinnerRule,
): ComputedResult {
    const rubberTypes = new Map(layout.map((l) => [l.rubberNumber, l.rubberType]));
    const teamId = (side: Side | null) => (side === null ? null : side === 'home' ? homeTeamId : awayTeamId);

    const tally: Tally = { rubbers: [0, 0], sets: [0, 0], games: [0, 0] };

    const computed = [...rubbers]
        .sort((a, b) => a.rubberNumber - b.rubberNumber)
        .map((rubber): ComputedRubber => {
            const sets = rubber.sets.map((s) => ({
                setNumber: s.setNumber,
                homeGames: s.homeGames,
                awayGames: s.awayGames,
                isMatchTiebreak: s.isMatchTiebreak,
                isComplete: s.isComplete ?? true,
                homeTiebreakPoints: s.homeTiebreakPoints ?? null,
                awayTiebreakPoints: s.awayTiebreakPoints ?? null,
            }));

            const winner = decideWinner(rubber.outcomeType, sets, rubber.winner ?? null);
            if (winner === 'home') tally.rubbers[0]++;
            if (winner === 'away') tally.rubbers[1]++;

            const summary = summariseRubber(sets);
            tally.sets[0] += summary.homeSetsWon;
            tally.sets[1] += summary.awaySetsWon;
            tally.games[0] += summary.homeGamesWon;
            tally.games[1] += summary.awayGamesWon;

            return {
                rubberNumber: rubber.rubberNumber,
                rubberType: rubberTypes.get(rubber.rubberNumber)!,
                outcomeType: rubber.outcomeType,
                winningTeamId: teamId(winner),
                sets,
                homePlayerIds: rubber.homePlayerIds,
                awayPlayerIds: rubber.awayPlayerIds,
            };
        });

    return {
        rubbers: computed,
        winningTeamId: teamId(decideMatchWinner(rule, tally)),
    };
}
