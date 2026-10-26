import { describe, it, expect } from 'vitest';
import { decideWinner, decideMatchWinner } from './decide-winner.js';
import type { Tally } from './decide-winner.js';
import type { SetScore } from '../rubbers/types.js';

function set(setNumber: number, homeGames: number, awayGames: number, overrides: Partial<SetScore> = {}): SetScore {
    return {
        setNumber,
        homeGames,
        awayGames,
        homeTiebreakPoints: null,
        awayTiebreakPoints: null,
        isMatchTiebreak: false,
        ...overrides,
    };
}

function tally(overrides: Partial<Tally>): Tally {
    return {
        rubbers: [0, 0],
        sets: [0, 0],
        games: [0, 0],
        ...overrides,
    };
}

describe('decideWinner', () => {
    it('gives a normal rubber to the side that won more sets', () => {
        expect(decideWinner('normal', [set(1, 6, 4), set(2, 6, 3)], null)).toBe('home');
        expect(decideWinner('normal', [set(1, 4, 6), set(2, 3, 6)], null)).toBe('away');
    });

    it('decides a three set rubber by sets, not games', () => {
        // away wins more games (13 v 12) but home wins more sets
        const sets = [set(1, 6, 4), set(2, 0, 6), set(3, 6, 3)];
        expect(decideWinner('normal', sets, null)).toBe('home');
    });

    it('returns no winner for a normal rubber with level sets', () => {
        expect(decideWinner('normal', [set(1, 6, 4), set(2, 4, 6)], null)).toBeNull();
    });

    it('ignores the claimed winner for a normal rubber', () => {
        expect(decideWinner('normal', [set(1, 6, 4), set(2, 6, 3)], 'away')).toBe('home');
    });

    it('uses the claimed winner for a retirement', () => {
        const sets = [set(1, 3, 1, { isComplete: false })];
        expect(decideWinner('retired', sets, 'away')).toBe('away');
    });

    it('uses the claimed winner for a walkover', () => {
        expect(decideWinner('walkover', [], 'home')).toBe('home');
    });

    it('returns null for a retirement or walkover with no claimed winner', () => {
        expect(decideWinner('retired', [set(1, 3, 1, { isComplete: false })], null)).toBeNull();
        expect(decideWinner('walkover', [], null)).toBeNull();
    });

    it('returns no winner for an incomplete rubber, even if one side is ahead', () => {
        const sets = [set(1, 6, 4), set(2, 3, 1, { isComplete: false })];
        expect(decideWinner('incomplete', sets, 'home')).toBeNull();
    });

    it('returns no winner for a rubber that was not played', () => {
        expect(decideWinner('not_played', [], 'home')).toBeNull();
    });
});

describe('decideMatchWinner', () => {
    describe('sets_then_games', () => {
        it('gives the match to the side with more sets', () => {
            expect(decideMatchWinner('sets_then_games', tally({ sets: [5, 3], games: [30, 40] }))).toBe('home');
            expect(decideMatchWinner('sets_then_games', tally({ sets: [2, 4], games: [30, 20] }))).toBe('away');
        });

        it('breaks a tie on sets by games', () => {
            expect(decideMatchWinner('sets_then_games', tally({ sets: [4, 4], games: [30, 28] }))).toBe('home');
            expect(decideMatchWinner('sets_then_games', tally({ sets: [4, 4], games: [27, 28] }))).toBe('away');
        });

        it('ignores rubbers', () => {
            expect(decideMatchWinner('sets_then_games', tally({ rubbers: [1, 3], sets: [5, 3] }))).toBe('home');
        });

        it('returns null when sets and games are level', () => {
            expect(decideMatchWinner('sets_then_games', tally({ sets: [4, 4], games: [30, 30] }))).toBeNull();
        });
    });

    describe('rubbers_then_sets', () => {
        it('gives the match to the side with more rubbers, even with fewer sets', () => {
            expect(decideMatchWinner('rubbers_then_sets', tally({ rubbers: [3, 1], sets: [4, 6], games: [30, 50] }))).toBe('home');
        });

        it('breaks a tie on rubbers by sets', () => {
            expect(decideMatchWinner('rubbers_then_sets', tally({ rubbers: [2, 2], sets: [5, 4], games: [30, 40] }))).toBe('home');
            expect(decideMatchWinner('rubbers_then_sets', tally({ rubbers: [2, 2], sets: [3, 4] }))).toBe('away');
        });

        it('breaks a tie on rubbers and sets by games', () => {
            expect(decideMatchWinner('rubbers_then_sets', tally({ rubbers: [2, 2], sets: [4, 4], games: [30, 31] }))).toBe('away');
        });

        it('returns null when rubbers, sets and games are all level', () => {
            expect(decideMatchWinner('rubbers_then_sets', tally({ rubbers: [2, 2], sets: [4, 4], games: [30, 30] }))).toBeNull();
        });

        it('returns null for a match with nothing played', () => {
            expect(decideMatchWinner('rubbers_then_sets', tally({}))).toBeNull();
        });
    });

    describe('ladder_position', () => {
        it('throws, because the scoresheet alone cannot decide it', () => {
            expect(() => decideMatchWinner('ladder_position', tally({ rubbers: [3, 1] }))).toThrow(
                'ladder_position matches cannot be decided from the scoresheet',
            );
        });
    });
});
