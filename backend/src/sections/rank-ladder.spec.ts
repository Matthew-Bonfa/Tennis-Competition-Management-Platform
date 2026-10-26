import { describe, it, expect } from 'vitest';
import { rankLadderRows } from './rank-ladder.js';
import type { LadderAccumulator } from './rank-ladder.js';

function row(overrides: Partial<LadderAccumulator>): LadderAccumulator {
    return {
        teamId: 1,
        teamName: 'Team',
        matchesPlayed: 0,
        matchesWon: 0,
        matchesDrawn: 0,
        matchesLost: 0,
        rubbersWon: 0,
        rubbersLost: 0,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0,
        points: 0,
        ...overrides,
    };
}

describe('rankLadderRows', () => {
    it('orders teams by points first', () => {
        const ranked = rankLadderRows([
            row({ teamId: 1, points: 10 }),
            row({ teamId: 2, points: 20 }),
        ]);

        expect(ranked.map((r) => r.teamId)).toEqual([2, 1]);
        expect(ranked[0].position).toBe(1);
        expect(ranked[1].position).toBe(2);
    });

    it('breaks a points tie on games percentage', () => {
        const ranked = rankLadderRows([
            row({ teamId: 1, points: 10, gamesWon: 20, gamesLost: 20 }), // 1.0
            row({ teamId: 2, points: 10, gamesWon: 30, gamesLost: 10 }), // 3.0
        ]);

        expect(ranked.map((r) => r.teamId)).toEqual([2, 1]);
        expect(ranked[0].percentage).toBe(3);
        expect(ranked[1].percentage).toBe(1);
    });

    it('breaks a points and percentage tie on set differential', () => {
        const ranked = rankLadderRows([
            row({ teamId: 1, points: 10, gamesWon: 10, gamesLost: 10, setsWon: 5, setsLost: 3 }),
            row({ teamId: 2, points: 10, gamesWon: 10, gamesLost: 10, setsWon: 8, setsLost: 2 }),
        ]);

        expect(ranked.map((r) => r.teamId)).toEqual([2, 1]);
    });

    it('treats a team with no games lost yet as an infinite percentage, ranked above one with a positive percentage', () => {
        const ranked = rankLadderRows([
            row({ teamId: 1, points: 10, gamesWon: 12, gamesLost: 0 }),
            row({ teamId: 2, points: 10, gamesWon: 12, gamesLost: 6 }),
        ]);

        expect(ranked[0].teamId).toBe(1);
        expect(ranked[0].percentage).toBe(Infinity);
    });

    it('gives a team with no games played at all a percentage of zero, not NaN', () => {
        const ranked = rankLadderRows([row({ teamId: 1, gamesWon: 0, gamesLost: 0 })]);

        expect(ranked[0].percentage).toBe(0);
        expect(Number.isNaN(ranked[0].percentage)).toBe(false);
    });
});
