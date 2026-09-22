import { describe, it, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { toFixture } from './to-fixture.js';

function makeMatch(overrides = {}) {
    return {
        id: 'm1',
        sectionId: 1,
        roundNumber: 1,
        matchDate: Temporal.Instant.from('2026-10-10T13:00:00Z'),
        matchStatus: 'completed' as const,
        homeTeam: { id: 1, name: 'Kilsyth 1', club: { id: 'c1', name: 'Kilsyth TC' } },
        awayTeam: { id: 2, name: 'Ringwood 1', club: { id: 'c2', name: 'Ringwood TC' } },
        rubbers: [{ winningTeamId: 1 }, { winningTeamId: 1 }, { winningTeamId: 2 }],
        ...overrides,
    };
}

describe('toFixture', () => {
    it('flattens the team and club into homeTeam/awayTeam', () => {
        const result = toFixture(makeMatch());
        expect(result.homeTeam).toEqual({ id: 1, name: 'Kilsyth 1', clubId: 'c1', clubName: 'Kilsyth TC' });
        expect(result.awayTeam).toEqual({ id: 2, name: 'Ringwood 1', clubId: 'c2', clubName: 'Ringwood TC' });
    });

    it('counts rubbers won by each side and reports the home winner', () => {
        const result = toFixture(makeMatch());
        expect(result.result).toEqual({ homeRubbersWon: 2, awayRubbersWon: 1, winner: 'home' });
    });

    it('reports an away win', () => {
        const result = toFixture(makeMatch({ rubbers: [{ winningTeamId: 2 }, { winningTeamId: 2 }, { winningTeamId: 1 }] }));
        expect(result.result).toEqual({ homeRubbersWon: 1, awayRubbersWon: 2, winner: 'away' });
    });

    it('reports a draw when rubbers are level', () => {
        const result = toFixture(makeMatch({ rubbers: [{ winningTeamId: 1 }, { winningTeamId: 2 }] }));
        expect(result.result).toEqual({ homeRubbersWon: 1, awayRubbersWon: 1, winner: 'draw' });
    });

    it('ignores rubbers with no winner', () => {
        const result = toFixture(makeMatch({ rubbers: [{ winningTeamId: 1 }, { winningTeamId: null }] }));
        expect(result.result).toEqual({ homeRubbersWon: 1, awayRubbersWon: 0, winner: 'home' });

    });

    it('returns a null result for a scheduled match', () => {
        const result = toFixture(makeMatch({ matchStatus: 'scheduled' }));
        expect(result.result).toBeNull();

    });

    it('returns matchDate as an ISO string', () => {
        const result = toFixture(makeMatch());
        expect(result.matchDate).toBe('2026-10-10T13:00:00.000Z');
    });
});