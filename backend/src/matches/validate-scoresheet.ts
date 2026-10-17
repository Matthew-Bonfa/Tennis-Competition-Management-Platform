import { validateRubber } from '../rubbers/validate-rubber.js';
import type { OutcomeType, RubberFormat, SetScore } from '../rubbers/types.js';
import type { Side } from './decide-winner.js';

export type RubberType = 'singles' | 'doubles' | 'mixed_doubles';

// One row of the format's rubber layout
export interface LayoutRubber {
    rubberNumber: number;
    rubberType: RubberType;
}

export interface SubmittedRubber {
    rubberNumber: number;
    outcomeType: OutcomeType;
    winner?: Side;
    homePlayerIds: string[];
    awayPlayerIds: string[];
    sets: Array<Omit<SetScore, 'homeTiebreakPoints' | 'awayTiebreakPoints'> & {
        homeTiebreakPoints?: number | null;
        awayTiebreakPoints?: number | null;
    }>;
}

export interface Rosters {
    home: string[];
    away: string[];
}

const PARTIAL_PLAYER_OUTCOMES: OutcomeType[] = ['walkover', 'not_played'];

const CLAIMED_WINNER_OUTCOMES: OutcomeType[] = ['retired', 'walkover'];

function playersNeeded(rubberType: RubberType): number {
    return rubberType === 'singles' ? 1 : 2;
}

function validatePlayers(
    label: string,
    side: 'home' | 'away',
    ids: string[],
    roster: string[],
    needed: number,
    outcome: OutcomeType,
): string[] {
    const errors: string[] = [];

    const partialAllowed = PARTIAL_PLAYER_OUTCOMES.includes(outcome);
    const countOk = partialAllowed ? ids.length <= needed : ids.length === needed;
    if (!countOk) {
        errors.push(`${label}: ${side} side needs ${needed} player${needed === 1 ? '' : 's'}, got ${ids.length}`);
    }

    if (new Set(ids).size !== ids.length) {
        errors.push(`${label}: ${side} side lists the same player twice`);
    }

    for (const id of ids) {
        if (!roster.includes(id)) {
            errors.push(`${label}: player ${id} is not on the ${side} team`);
        }
    }

    return errors;
}

// Checks a whole scoresheet against the format and returns every problem found
export function validateScoresheet(
    format: RubberFormat,
    layout: LayoutRubber[],
    rubbers: SubmittedRubber[],
    rosters: Rosters,
): string[] {
    const errors: string[] = [];

    // exactly one submitted rubber per layout row.
    const seen = new Set<number>();
    for (const rubber of rubbers) {
        if (seen.has(rubber.rubberNumber)) {
            errors.push(`Rubber ${rubber.rubberNumber}: submitted more than once`);
        }
        seen.add(rubber.rubberNumber);
    }

    const layoutByNumber = new Map(layout.map((l) => [l.rubberNumber, l]));
    for (const rubber of rubbers) {
        if (!layoutByNumber.has(rubber.rubberNumber)) {
            errors.push(`Rubber ${rubber.rubberNumber}: not part of this format`);
        }
    }
    for (const row of layout) {
        if (!seen.has(row.rubberNumber)) {
            errors.push(`Rubber ${row.rubberNumber}: missing`);
        }
    }

    const checked = new Set<number>();
    for (const rubber of rubbers) {
        const row = layoutByNumber.get(rubber.rubberNumber);
        if (!row || checked.has(rubber.rubberNumber)) {
            continue;
        }
        checked.add(rubber.rubberNumber);

        const label = `Rubber ${rubber.rubberNumber}`;
        const needed = playersNeeded(row.rubberType);

        errors.push(
            ...validatePlayers(label, 'home', rubber.homePlayerIds, rosters.home, needed, rubber.outcomeType),
            ...validatePlayers(label, 'away', rubber.awayPlayerIds, rosters.away, needed, rubber.outcomeType),
        );

        // nobody can play for both teams in the same rubber.
        const home = new Set(rubber.homePlayerIds);
        if (rubber.awayPlayerIds.some((id) => home.has(id))) {
            errors.push(`${label}: a player is on both sides`);
        }

        // checks if the outcome needs a winner provided in the case of a walkover or retirement
        const needsWinner = CLAIMED_WINNER_OUTCOMES.includes(rubber.outcomeType);
        if (needsWinner && !rubber.winner) {
            errors.push(`${label}: a rubber with outcome ${rubber.outcomeType} needs a winner`);
        }
        if (!needsWinner && rubber.winner) {
            errors.push(`${label}: a rubber with outcome ${rubber.outcomeType} must not have a winner`);
        }

        // score rules for the sets themselves.
        const sets: SetScore[] = rubber.sets.map((s) => ({
            ...s,
            homeTiebreakPoints: s.homeTiebreakPoints ?? null,
            awayTiebreakPoints: s.awayTiebreakPoints ?? null,
        }));
        const result = validateRubber(format, sets, rubber.outcomeType);
        errors.push(...result.errors.map((message) => `${label}: ${message}`));
    }

    return errors;
}
