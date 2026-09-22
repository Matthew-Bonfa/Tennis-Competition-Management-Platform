import { describe, it, expect } from 'vitest';
import { validateRubber } from './validate-rubber.js';
import type { RubberFormat } from './types.js';

const bestOfThree: RubberFormat = {
    setsToWin: 2,
    gamesPerSet: 6,
    tiebreakAtGames: 6,
    finalSetMatchTiebreak: false,
};

const fast4: RubberFormat = {
    setsToWin: 2,
    gamesPerSet: 4,
    tiebreakAtGames: 3,
    finalSetMatchTiebreak: true,
};

describe('validateRubber', () => {
    it('validates a rubber with a straight sets win', () => {
        const result = validateRubber(bestOfThree, [
            { setNumber: 1, homeGames: 6, awayGames: 4, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
            { setNumber: 2, homeGames: 6, awayGames: 3, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
        ]);

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it('invalidates a rubber with an illegal set score', () => {
        const result = validateRubber(bestOfThree, [
            { setNumber: 1, homeGames: 8, awayGames: 2, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
        ]);

        expect(result.isValid).toBe(false);
        expect(result.errors).not.toEqual([]);
    });

    it('invalidates a rubber with too many sets', () => {
        const result = validateRubber(bestOfThree, [
            { setNumber: 1, homeGames: 6, awayGames: 4, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
            { setNumber: 2, homeGames: 6, awayGames: 3, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
            { setNumber: 3, homeGames: 6, awayGames: 0, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
        ]);

        expect(result.isValid).toBe(false);
        expect(result.errors).not.toEqual([]);
    });

    it('validates a rubber in a Fast4 format', () => {
        const result = validateRubber(fast4, [
            { setNumber: 1, homeGames: 4, awayGames: 1, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
            { setNumber: 2, homeGames: 4, awayGames: 2, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
        ]);

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });
});
