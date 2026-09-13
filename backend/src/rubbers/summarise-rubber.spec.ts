import { describe, it, expect } from 'vitest';
import { summariseRubber } from './summarise-rubber.js';

describe('summariseRubber', () => {
    it('summarises a rubber with a straight sets win', () => {
        expect(summariseRubber([
            { setNumber: 1, homeGames: 6, awayGames: 4, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
            { setNumber: 2, homeGames: 6, awayGames: 3, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
        ])).toEqual({
            homeSetsWon: 2,
            awaySetsWon: 0,
            homeGamesWon: 12,
            awayGamesWon: 7,
        });
    });

    it ('summarises a rubber with a tiebreak win', () => {
        expect(summariseRubber([
            { setNumber: 1, homeGames: 7, awayGames: 6, homeTiebreakPoints: 7, awayTiebreakPoints: 5, isMatchTiebreak: false },
            { setNumber: 2, homeGames: 6, awayGames: 4, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
        ])).toEqual({
            homeSetsWon: 2,
            awaySetsWon: 0,
            homeGamesWon: 13,
            awayGamesWon: 10,
        });
    });

    it('summarises a rubber with a match tiebreak win', () => {
        expect(summariseRubber([
            { setNumber: 1, homeGames: 6, awayGames: 4, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
            { setNumber: 2, homeGames: 3, awayGames: 6, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
            { setNumber: 3, homeGames: 1, awayGames: 0, homeTiebreakPoints: 10, awayTiebreakPoints: 7, isMatchTiebreak: true },
        ])).toEqual({
            homeSetsWon: 2,
            awaySetsWon: 1,
            homeGamesWon: 10,
            awayGamesWon: 10,
        });
    });
});