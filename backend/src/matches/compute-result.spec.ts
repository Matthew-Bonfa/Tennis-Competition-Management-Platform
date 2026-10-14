import { describe, it, expect } from 'vitest';
import { computeResult } from './compute-result.js';
import type { LayoutRubber, SubmittedRubber } from './validate-scoresheet.js';

const HOME = 10;
const AWAY = 20;

const layout: LayoutRubber[] = [
    { rubberNumber: 1, rubberType: 'singles' },
    { rubberNumber: 2, rubberType: 'singles' },
    { rubberNumber: 3, rubberType: 'doubles' },
];

function sets(...scores: Array<[number, number]>) {
    return scores.map(([homeGames, awayGames], i) => ({
        setNumber: i + 1, homeGames, awayGames, isMatchTiebreak: false,
    }));
}

function rubber(rubberNumber: number, overrides: Partial<SubmittedRubber> = {}): SubmittedRubber {
    return {
        rubberNumber,
        outcomeType: 'normal',
        homePlayerIds: ['h1'],
        awayPlayerIds: ['a1'],
        sets: sets([6, 4], [6, 3]), // home wins
        ...overrides,
    };
}

const awayWin = sets([3, 6], [4, 6]);

describe('computeResult', () => {
    it('decides each rubber winner and maps it to a team id', () => {
        const result = computeResult(layout, [rubber(1), rubber(2, { sets: awayWin }), rubber(3)], HOME, AWAY, 'rubbers_then_sets');
        expect(result.rubbers.map((r) => r.winningTeamId)).toEqual([HOME, AWAY, HOME]);
    });

    it('gives the match to the team that won more rubbers', () => {
        const result = computeResult(layout, [rubber(1), rubber(2, { sets: awayWin }), rubber(3)], HOME, AWAY, 'rubbers_then_sets');
        expect(result.winningTeamId).toBe(HOME);
    });

    it('copies rubberType from the format layout', () => {
        const result = computeResult(layout, [rubber(1), rubber(2), rubber(3)], HOME, AWAY, 'rubbers_then_sets');
        expect(result.rubbers.map((r) => r.rubberType)).toEqual(['singles', 'singles', 'doubles']);
    });

    it('returns rubbers in rubber-number order whatever order they were sent', () => {
        const result = computeResult(layout, [rubber(3), rubber(1), rubber(2)], HOME, AWAY, 'rubbers_then_sets');
        expect(result.rubbers.map((r) => r.rubberNumber)).toEqual([1, 2, 3]);
    });

    it('returns a null match winner for a draw', () => {
        // one rubber each, and level on sets and games
        const twoRubbers = layout.slice(0, 2);
        const result = computeResult(
            twoRubbers,
            [rubber(1, { sets: sets([6, 3], [6, 3]) }), rubber(2, { sets: sets([3, 6], [3, 6]) })],
            HOME, AWAY, 'rubbers_then_sets',
        );
        expect(result.winningTeamId).toBeNull();
    });

    it('breaks level rubbers by sets under rubbers_then_sets', () => {
        const twoRubbers = layout.slice(0, 2);
        const result = computeResult(
            twoRubbers,
            // one rubber each; home wins rubber 1 2-0 and loses rubber 2 1-2, so sets are 3-2 to home
            [rubber(1, { sets: sets([6, 4], [6, 2]) }), rubber(2, { sets: sets([6, 3], [3, 6], [2, 6]) })],
            HOME, AWAY, 'rubbers_then_sets',
        );
        expect(result.winningTeamId).toBe(HOME);
    });

    it('decides by sets first under sets_then_games, ignoring rubbers', () => {
        // away wins 2 rubbers, home wins 1 but with more sets overall
        const result = computeResult(
            layout,
            [
                rubber(1, { sets: sets([6, 0], [6, 0]) }),
                rubber(2, { sets: sets([4, 6], [5, 7]) }),
                rubber(3, { sets: sets([4, 6], [5, 7]) }),
            ],
            HOME, AWAY, 'sets_then_games',
        );
        // home: 2 sets, away: 4 sets -> away
        expect(result.winningTeamId).toBe(AWAY);
    });

    it('uses the claimed winner for a walkover and gives it no sets', () => {
        const result = computeResult(
            layout.slice(0, 1),
            [rubber(1, { outcomeType: 'walkover', winner: 'away', sets: [], homePlayerIds: [] })],
            HOME, AWAY, 'rubbers_then_sets',
        );
        expect(result.rubbers[0].winningTeamId).toBe(AWAY);
        expect(result.winningTeamId).toBe(AWAY);
    });

    it('gives a not played rubber no winner and counts nothing', () => {
        const result = computeResult(
            layout.slice(0, 2),
            [rubber(1), rubber(2, { outcomeType: 'not_played', sets: [], homePlayerIds: [], awayPlayerIds: [] })],
            HOME, AWAY, 'rubbers_then_sets',
        );
        expect(result.rubbers[1].winningTeamId).toBeNull();
        expect(result.winningTeamId).toBe(HOME);
    });

    it('counts the games of an incomplete set but not the set, and gives the rubber no winner', () => {
        const result = computeResult(
            layout.slice(0, 1),
            [rubber(1, {
                outcomeType: 'incomplete',
                sets: [
                    { setNumber: 1, homeGames: 6, awayGames: 4, isMatchTiebreak: false },
                    { setNumber: 2, homeGames: 5, awayGames: 0, isMatchTiebreak: false, isComplete: false },
                ],
            })],
            HOME, AWAY, 'sets_then_games',
        );
        expect(result.rubbers[0].winningTeamId).toBeNull();
        // home has 1 set to 0; the unfinished set doesn't add a second
        expect(result.winningTeamId).toBe(HOME);
    });

    it('fills in isComplete and tiebreak points on every saved set', () => {
        const result = computeResult(layout.slice(0, 1), [rubber(1)], HOME, AWAY, 'rubbers_then_sets');
        expect(result.rubbers[0].sets[0]).toEqual({
            setNumber: 1, homeGames: 6, awayGames: 4, isMatchTiebreak: false,
            isComplete: true, homeTiebreakPoints: null, awayTiebreakPoints: null,
        });
    });

    it('throws for a ladder_position format', () => {
        expect(() => computeResult(layout.slice(0, 1), [rubber(1)], HOME, AWAY, 'ladder_position')).toThrow();
    });
});
