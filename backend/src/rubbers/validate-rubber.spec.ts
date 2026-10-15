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
        ], 'normal');

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it('invalidates a rubber with an illegal set score', () => {
        const result = validateRubber(bestOfThree, [
            { setNumber: 1, homeGames: 8, awayGames: 2, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
        ], 'normal');

        expect(result.isValid).toBe(false);
        expect(result.errors).not.toEqual([]);
    });

    it('invalidates a rubber with too many sets', () => {
        const result = validateRubber(bestOfThree, [
            { setNumber: 1, homeGames: 6, awayGames: 4, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
            { setNumber: 2, homeGames: 6, awayGames: 3, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
            { setNumber: 3, homeGames: 6, awayGames: 0, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
        ], 'normal');

        expect(result.isValid).toBe(false);
        expect(result.errors).not.toEqual([]);
    });

    it('validates a rubber in a Fast4 format', () => {
        const result = validateRubber(fast4, [
            { setNumber: 1, homeGames: 4, awayGames: 1, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
            { setNumber: 2, homeGames: 4, awayGames: 2, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
        ], 'normal');

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it('validates a retirement with an incomplete set count', () => {
        const result = validateRubber(bestOfThree, [
            { setNumber: 1, homeGames: 3, awayGames: 2, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false, isComplete: false },
        ], 'retired');

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it('validates a walkover with no sets at all', () => {
        const result = validateRubber(bestOfThree, [], 'walkover');

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it('validates a retirement even with an illegal score in the unfinished set', () => {
        const result = validateRubber(bestOfThree, [
            { setNumber: 1, homeGames: 9, awayGames: 1, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false, isComplete: false },
        ], 'retired');

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it('invalidates a walkover that has sets', () => {
        const result = validateRubber(bestOfThree, [
            { setNumber: 1, homeGames: 6, awayGames: 4, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
        ], 'walkover');

        expect(result.isValid).toBe(false);
        expect(result.errors).not.toEqual([]);
    });

    it('validates a not played rubber with no sets', () => {
        const result = validateRubber(bestOfThree, [], 'not_played');

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it('invalidates a not played rubber that has sets', () => {
        const result = validateRubber(bestOfThree, [
            { setNumber: 1, homeGames: 2, awayGames: 1, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false, isComplete: false },
        ], 'not_played');

        expect(result.isValid).toBe(false);
        expect(result.errors).not.toEqual([]);
    });

    it('invalidates a retirement whose last set is not marked incomplete', () => {
        const result = validateRubber(bestOfThree, [
            { setNumber: 1, homeGames: 3, awayGames: 2, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
        ], 'retired');

        expect(result.isValid).toBe(false);
        expect(result.errors).not.toEqual([]);
    });

    it('invalidates a retirement with no sets', () => {
        const result = validateRubber(bestOfThree, [], 'retired');

        expect(result.isValid).toBe(false);
        expect(result.errors).not.toEqual([]);
    });

    it('invalidates a retirement with an illegal completed set before the unfinished one', () => {
        const result = validateRubber(bestOfThree, [
            { setNumber: 1, homeGames: 8, awayGames: 2, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
            { setNumber: 2, homeGames: 1, awayGames: 0, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false, isComplete: false },
        ], 'retired');

        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(['Illegal set score: 8-2']);
    });

    it('validates an incomplete rubber with a completed set then an unfinished one', () => {
        const result = validateRubber(bestOfThree, [
            { setNumber: 1, homeGames: 6, awayGames: 4, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
            { setNumber: 2, homeGames: 2, awayGames: 3, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false, isComplete: false },
        ], 'incomplete');

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });
});
