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

    describe('match tiebreaks', () => {
        const set = (setNumber: number, homeGames: number, awayGames: number) => ({
            setNumber, homeGames, awayGames, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false,
        });
        // A match tiebreak is stored as a 1-0 set, with the points kept separately
        const matchTiebreak = (setNumber: number, homePoints: number, awayPoints: number) => ({
            setNumber,
            homeGames: homePoints > awayPoints ? 1 : 0,
            awayGames: awayPoints > homePoints ? 1 : 0,
            homeTiebreakPoints: homePoints,
            awayTiebreakPoints: awayPoints,
            isMatchTiebreak: true,
        });

        it('validates a match tiebreak as the deciding set', () => {
            const result = validateRubber(fast4, [set(1, 4, 1), set(2, 2, 4), matchTiebreak(3, 10, 8)], 'normal');

            expect(result.errors).toEqual([]);
            expect(result.isValid).toBe(true);
        });

        it('validates a match tiebreak won by two after passing ten', () => {
            const result = validateRubber(fast4, [set(1, 4, 1), set(2, 2, 4), matchTiebreak(3, 10, 12)], 'normal');

            expect(result.errors).toEqual([]);
        });

        it('invalidates a match tiebreak won by one point', () => {
            const result = validateRubber(fast4, [set(1, 4, 1), set(2, 2, 4), matchTiebreak(3, 10, 9)], 'normal');

            expect(result.errors).toEqual(['Illegal match tiebreak score: 10-9']);
        });

        it('invalidates a match tiebreak that went past ten without a two point margin', () => {
            const result = validateRubber(fast4, [set(1, 4, 1), set(2, 2, 4), matchTiebreak(3, 11, 8)], 'normal');

            expect(result.errors).toEqual(['Illegal match tiebreak score: 11-8']);
        });

        it('invalidates a match tiebreak whose set winner disagrees with its points', () => {
            const result = validateRubber(fast4, [
                set(1, 4, 1), set(2, 2, 4), { ...matchTiebreak(3, 10, 8), homeGames: 0, awayGames: 1 },
            ], 'normal');

            expect(result.errors).toEqual(['Illegal match tiebreak score: 10-8']);
        });

        it('invalidates a match tiebreak with no points', () => {
            const result = validateRubber(fast4, [
                set(1, 4, 1), set(2, 2, 4), { ...matchTiebreak(3, 10, 8), homeTiebreakPoints: null },
            ], 'normal');

            expect(result.isValid).toBe(false);
        });

        it('invalidates a match tiebreak in a format that plays a full final set', () => {
            const result = validateRubber(bestOfThree, [set(1, 6, 4), set(2, 3, 6), matchTiebreak(3, 10, 8)], 'normal');

            expect(result.errors).toEqual(['Set 3: this format does not use a match tiebreak']);
        });

        it('invalidates a match tiebreak before the deciding set', () => {
            const result = validateRubber(fast4, [set(1, 4, 1), matchTiebreak(2, 10, 8)], 'normal');

            expect(result.errors).toEqual(['Set 2: only the deciding set can be a match tiebreak']);
        });

        it('invalidates a full deciding set in a match tiebreak format', () => {
            const result = validateRubber(fast4, [set(1, 4, 1), set(2, 2, 4), set(3, 4, 2)], 'normal');

            expect(result.errors).toEqual(['Set 3: the deciding set must be a match tiebreak']);
        });
    });
});
