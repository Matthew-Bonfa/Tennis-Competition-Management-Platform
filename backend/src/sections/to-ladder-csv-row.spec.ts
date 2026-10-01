import { describe, it, expect } from 'vitest';
import { toLadderCsvRow } from './to-ladder-csv-row.js';
import type { LadderRow } from './types.js';

function baseRow(overrides: Partial<LadderRow> = {}): LadderRow {
    return {
        teamId: 1,
        teamName: 'Kilsyth 1',
        position: 1,
        matchesPlayed: 4,
        matchesWon: 3,
        matchesDrawn: 0,
        matchesLost: 1,
        rubbersWon: 10,
        rubbersLost: 6,
        setsWon: 20,
        setsLost: 12,
        gamesWon: 96,
        gamesLost: 80,
        percentage: 1.2,
        points: 6,
        ...overrides,
    };
}

describe('toLadderCsvRow', () => {
    it('formats a normal percentage to three decimal places', () => {
        const row = toLadderCsvRow(baseRow({ percentage: 96 / 80 }));
        expect(row.percentage).toBe('1.200');
    });

    it('blanks an Infinity percentage for a team that has not dropped a game', () => {
        const row = toLadderCsvRow(baseRow({ gamesWon: 48, gamesLost: 0, percentage: Infinity }));
        expect(row.percentage).toBe('');
    });

    it('passes a fractional points total through unchanged', () => {
        const row = toLadderCsvRow(baseRow({ points: 4.5 }));
        expect(row.points).toBe(4.5);
    });

    it('keeps the other fields unchanged', () => {
        const row = toLadderCsvRow(baseRow());
        expect(row).toMatchObject({
            teamId: 1,
            teamName: 'Kilsyth 1',
            position: 1,
            matchesPlayed: 4,
            matchesWon: 3,
            matchesDrawn: 0,
            matchesLost: 1,
            rubbersWon: 10,
            rubbersLost: 6,
            setsWon: 20,
            setsLost: 12,
            gamesWon: 96,
            gamesLost: 80,
        });
    });
});
