import { describe, it, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { groupIntoRounds } from './group-rounds.js';
import type { RoundMatchRow } from './group-rounds.js';

function match(overrides: Partial<RoundMatchRow>): RoundMatchRow {
    return {
        roundNumber: 1,
        matchDate: Temporal.Instant.from('2026-10-10T13:00:00Z'),
        matchStatus: 'scheduled',
        ...overrides,
    };
}

describe('groupIntoRounds', () => {
    it('groups matches by round number', () => {
        const rounds = groupIntoRounds([
            match({ roundNumber: 1 }),
            match({ roundNumber: 1 }),
            match({ roundNumber: 2 }),
        ]);

        expect(rounds).toHaveLength(2);
        expect(rounds[0]).toMatchObject({ roundNumber: 1, matchCount: 2 });
        expect(rounds[1]).toMatchObject({ roundNumber: 2, matchCount: 1 });
    });

    it('labels each round as R<n>', () => {
        const rounds = groupIntoRounds([match({ roundNumber: 3 })]);
        expect(rounds[0].label).toBe('R3');
    });

    it('sorts rounds in ascending order regardless of input order', () => {
        const rounds = groupIntoRounds([
            match({ roundNumber: 3 }),
            match({ roundNumber: 1 }),
            match({ roundNumber: 2 }),
        ]);

        expect(rounds.map((r) => r.roundNumber)).toEqual([1, 2, 3]);
    });

    it('marks a round complete only when every match in it is no longer scheduled', () => {
        const allComplete = groupIntoRounds([
            match({ roundNumber: 1, matchStatus: 'completed' }),
            match({ roundNumber: 1, matchStatus: 'washout' }),
        ]);
        expect(allComplete[0].allComplete).toBe(true);

        const stillPending = groupIntoRounds([
            match({ roundNumber: 1, matchStatus: 'completed' }),
            match({ roundNumber: 1, matchStatus: 'scheduled' }),
        ]);
        expect(stillPending[0].allComplete).toBe(false);
    });

    it('takes the earliest match date in the round', () => {
        const rounds = groupIntoRounds([
            match({ roundNumber: 1, matchDate: Temporal.Instant.from('2026-10-10T13:00:00Z') }),
            match({ roundNumber: 1, matchDate: Temporal.Instant.from('2026-10-10T09:00:00Z') }),
        ]);

        expect(rounds[0].firstMatchDate).toBe('2026-10-10T09:00:00.000Z');
    });

    it('returns an empty list for a section with no matches', () => {
        expect(groupIntoRounds([])).toEqual([]);
    });
});
