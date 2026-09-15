import { describe, it, expect } from 'vitest';
import { formatScoreLine } from './format-scoreline.js';

describe('formatScoreline', () => {
    it('formats the scoreline for a straight sets match', () => {
        expect(formatScoreLine([
            { setNumber: 1, homeGames: 6, awayGames: 4, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
            { setNumber: 2, homeGames: 6, awayGames: 3, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
        ])).toBe('6-4 6-3');
    });

    it('formats the scoreline for a match with a tiebreak', () => {
        expect(formatScoreLine([
            { setNumber: 1, homeGames: 7, awayGames: 6, homeTiebreakPoints: 7, awayTiebreakPoints: 5, isMatchTiebreak: false },
            { setNumber: 2, homeGames: 6, awayGames: 4, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
        ])).toBe('7-6(5) 6-4');
    });

    it('formats the scoreline for a match with a match tiebreak', () => {
        expect(formatScoreLine([
            { setNumber: 1, homeGames: 6, awayGames: 4, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
            { setNumber: 2, homeGames: 3, awayGames: 6, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
            { setNumber: 3, homeGames: 1, awayGames: 0, homeTiebreakPoints: 10, awayTiebreakPoints: 7, isMatchTiebreak: true },
        ])).toBe('6-4 3-6 [10-7]');
    });
});