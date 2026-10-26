import { describe, it, expect } from 'vitest';
import { toFixtureCsvRow } from './to-fixture-csv-row.js';
import type { Fixture } from './types.js';

const homeTeam = { id: 1, name: 'Kilsyth 1', clubId: 'club-1', clubName: 'Kilsyth' };
const awayTeam = { id: 2, name: 'Ringwood 1', clubId: 'club-2', clubName: 'Ringwood' };

function baseFixture(overrides: Partial<Fixture> = {}): Fixture {
    return {
        matchId: 'match-1',
        sectionId: 1,
        roundNumber: 3,
        matchDate: '2026-06-13T09:00:00.000Z',
        location: 'Kilsyth',
        locationClubId: 'club-1',
        status: 'scheduled',
        homeTeam,
        awayTeam,
        result: null,
        ...overrides,
    };
}

describe('toFixtureCsvRow', () => {
    it('includes the fixture location, or blank when there is none', () => {
        expect(toFixtureCsvRow(baseFixture({ location: 'Court 3, Albert Park' })).location).toBe('Court 3, Albert Park');
        expect(toFixtureCsvRow(baseFixture({ location: null })).location).toBe('');
    });

    it('maps a completed fixture with a home win', () => {
        const row = toFixtureCsvRow(baseFixture({
            status: 'completed',
            result: { homeRubbersWon: 4, awayRubbersWon: 2, winner: 'home' },
        }));

        expect(row).toMatchObject({
            round: 3,
            date: '2026-06-13',
            time: '19:00',
            status: 'completed',
            homeTeam: 'Kilsyth 1',
            awayTeam: 'Ringwood 1',
            homeRubbers: 4,
            awayRubbers: 2,
            outcome: 'Kilsyth 1',
            sectionId: 1,
            matchId: 'match-1',
        });
    });

    it('maps a completed fixture with an away win', () => {
        const row = toFixtureCsvRow(baseFixture({
            status: 'completed',
            result: { homeRubbersWon: 1, awayRubbersWon: 5, winner: 'away' },
        }));

        expect(row.outcome).toBe('Ringwood 1');
    });

    it('maps a drawn fixture', () => {
        const row = toFixtureCsvRow(baseFixture({
            status: 'completed',
            result: { homeRubbersWon: 3, awayRubbersWon: 3, winner: 'draw' },
        }));

        expect(row.outcome).toBe('Draw');
    });

    it('leaves rubber counts and outcome blank for an unplayed fixture', () => {
        const row = toFixtureCsvRow(baseFixture({ status: 'scheduled', result: null }));

        expect(row.homeRubbers).toBe('');
        expect(row.awayRubbers).toBe('');
        expect(row.outcome).toBe('');
    });

    it('converts the UTC match date into the local Melbourne calendar day', () => {
        // 13:30 UTC on 10 Jan is 00:30 AEDT on 11 Jan - a naive slice of the
        // ISO string would report the wrong date.
        const row = toFixtureCsvRow(baseFixture({ matchDate: '2026-01-10T13:30:00.000Z' }));

        expect(row.date).toBe('2026-01-11');
        expect(row.time).toBe('00:30');
    });
});
