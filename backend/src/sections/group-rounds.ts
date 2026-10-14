import type { Temporal } from '@js-temporal/polyfill';
import { fromInstant } from '../common/temporal.js';
import type { MatchStatus } from '../fixtures/types.js';
import type { RoundSummary } from './types.js';

export interface RoundMatchRow {
    roundNumber: number;
    matchDate: Temporal.Instant;
    matchStatus: MatchStatus;
}

// exclude awaiting result and disputed matches
const FINAL_STATUSES: MatchStatus[] = ['completed', 'washout', 'forfeit', 'bye'];

export function groupIntoRounds(matches: RoundMatchRow[]): RoundSummary[] {
    const groups = new Map<number, RoundMatchRow[]>();

    for (const match of matches) {
        const roundMatches = groups.get(match.roundNumber) ?? [];
        roundMatches.push(match);
        groups.set(match.roundNumber, roundMatches);
    }

    const rounds: RoundSummary[] = [];

    for (const [roundNumber, roundMatches] of groups) {
        const matchDates = roundMatches.map((m) => fromInstant(m.matchDate).toISOString());

        rounds.push({
            roundNumber,
            label: `R${roundNumber}`,
            matchCount: roundMatches.length,
            firstMatchDate: matchDates.length > 0 ? matchDates.sort()[0] : null,
            allComplete: roundMatches.every((m) => FINAL_STATUSES.includes(m.matchStatus)),
        });
    }

    rounds.sort((a, b) => a.roundNumber - b.roundNumber);

    return rounds;
}
