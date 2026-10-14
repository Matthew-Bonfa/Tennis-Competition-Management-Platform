import { describe, it, expect } from 'vitest';
import { validateScoresheet } from './validate-scoresheet.js';
import type { LayoutRubber, Rosters, SubmittedRubber } from './validate-scoresheet.js';
import type { RubberFormat } from '../rubbers/types.js';

const format: RubberFormat = {
    setsToWin: 2,
    gamesPerSet: 6,
    tiebreakAtGames: 6,
    finalSetMatchTiebreak: false,
};

// Two singles then a doubles
const layout: LayoutRubber[] = [
    { rubberNumber: 1, rubberType: 'singles' },
    { rubberNumber: 2, rubberType: 'singles' },
    { rubberNumber: 3, rubberType: 'doubles' },
];

const rosters: Rosters = {
    home: ['h1', 'h2', 'h3'],
    away: ['a1', 'a2', 'a3'],
};

const straightSets = [
    { setNumber: 1, homeGames: 6, awayGames: 4, isMatchTiebreak: false },
    { setNumber: 2, homeGames: 6, awayGames: 3, isMatchTiebreak: false },
];

function rubber(overrides: Partial<SubmittedRubber>): SubmittedRubber {
    return {
        rubberNumber: 1,
        outcomeType: 'normal',
        homePlayerIds: ['h1'],
        awayPlayerIds: ['a1'],
        sets: straightSets,
        ...overrides,
    };
}

function validSheet(): SubmittedRubber[] {
    return [
        rubber({ rubberNumber: 1 }),
        rubber({ rubberNumber: 2, homePlayerIds: ['h2'], awayPlayerIds: ['a2'] }),
        rubber({ rubberNumber: 3, homePlayerIds: ['h1', 'h3'], awayPlayerIds: ['a1', 'a3'] }),
    ];
}

describe('validateScoresheet', () => {
    it('accepts a valid scoresheet', () => {
        expect(validateScoresheet(format, layout, validSheet(), rosters)).toEqual([]);
    });

    describe('rubber layout', () => {
        it('reports a missing rubber', () => {
            const errors = validateScoresheet(format, layout, validSheet().slice(0, 2), rosters);
            expect(errors).toEqual(['Rubber 3: missing']);
        });

        it('reports a rubber that is not in the format', () => {
            const sheet = [...validSheet(), rubber({ rubberNumber: 4 })];
            expect(validateScoresheet(format, layout, sheet, rosters)).toEqual(['Rubber 4: not part of this format']);
        });

        it('reports a rubber submitted twice', () => {
            const sheet = [...validSheet(), rubber({ rubberNumber: 1 })];
            expect(validateScoresheet(format, layout, sheet, rosters)).toEqual(['Rubber 1: submitted more than once']);
        });

        it('reports an empty sheet as every rubber missing', () => {
            expect(validateScoresheet(format, layout, [], rosters)).toEqual([
                'Rubber 1: missing',
                'Rubber 2: missing',
                'Rubber 3: missing',
            ]);
        });
    });

    describe('players', () => {
        it('rejects two players on a singles side', () => {
            const sheet = validSheet();
            sheet[0] = rubber({ rubberNumber: 1, homePlayerIds: ['h1', 'h2'] });
            expect(validateScoresheet(format, layout, sheet, rosters)).toEqual([
                'Rubber 1: home side needs 1 player, got 2',
            ]);
        });

        it('rejects one player on a doubles side', () => {
            const sheet = validSheet();
            sheet[2] = rubber({ rubberNumber: 3, homePlayerIds: ['h1'], awayPlayerIds: ['a1', 'a3'] });
            expect(validateScoresheet(format, layout, sheet, rosters)).toEqual([
                'Rubber 3: home side needs 2 players, got 1',
            ]);
        });

        it('rejects a normal rubber with no players', () => {
            const sheet = validSheet();
            sheet[0] = rubber({ rubberNumber: 1, homePlayerIds: [], awayPlayerIds: [] });
            expect(validateScoresheet(format, layout, sheet, rosters)).toEqual([
                'Rubber 1: home side needs 1 player, got 0',
                'Rubber 1: away side needs 1 player, got 0',
            ]);
        });

        it('rejects a player who is not on that side\'s roster', () => {
            const sheet = validSheet();
            sheet[0] = rubber({ rubberNumber: 1, homePlayerIds: ['a1'], awayPlayerIds: ['h1'] });
            const errors = validateScoresheet(format, layout, sheet, rosters);
            expect(errors).toContain('Rubber 1: player a1 is not on the home team');
            expect(errors).toContain('Rubber 1: player h1 is not on the away team');
        });

        it('rejects the same player twice in one rubber', () => {
            const sheet = validSheet();
            sheet[2] = rubber({ rubberNumber: 3, homePlayerIds: ['h1', 'h1'], awayPlayerIds: ['a1', 'a3'] });
            expect(validateScoresheet(format, layout, sheet, rosters)).toEqual([
                'Rubber 3: home side lists the same player twice',
            ]);
        });

        it('rejects a player on both sides of one rubber', () => {
            const crossed: Rosters = { home: ['p1', 'h2'], away: ['p1', 'a2'] };
            const sheet = [
                rubber({ rubberNumber: 1, homePlayerIds: ['p1'], awayPlayerIds: ['p1'] }),
                rubber({ rubberNumber: 2, homePlayerIds: ['h2'], awayPlayerIds: ['a2'] }),
                rubber({ rubberNumber: 3, homePlayerIds: ['h2', 'p1'], awayPlayerIds: ['a2', 'a2'] }),
            ];
            expect(validateScoresheet(format, layout, sheet, crossed)).toContain('Rubber 1: a player is on both sides');
        });

        it('allows the same player in different rubbers', () => {
            // h1 plays rubber 1 and the doubles in validSheet()
            expect(validateScoresheet(format, layout, validSheet(), rosters)).toEqual([]);
        });

        it('allows a walkover or not played rubber to have no players', () => {
            const sheet = validSheet();
            sheet[0] = rubber({ rubberNumber: 1, outcomeType: 'walkover', winner: 'away', homePlayerIds: [], awayPlayerIds: ['a1'], sets: [] });
            sheet[1] = rubber({ rubberNumber: 2, outcomeType: 'not_played', homePlayerIds: [], awayPlayerIds: [], sets: [] });
            expect(validateScoresheet(format, layout, sheet, rosters)).toEqual([]);
        });

        it('still rejects too many players on a walkover', () => {
            const sheet = validSheet();
            sheet[0] = rubber({ rubberNumber: 1, outcomeType: 'walkover', winner: 'away', homePlayerIds: ['h1', 'h2'], sets: [] });
            expect(validateScoresheet(format, layout, sheet, rosters)).toEqual([
                'Rubber 1: home side needs 1 player, got 2',
            ]);
        });
    });

    describe('winner', () => {
        it('requires a winner for a walkover', () => {
            const sheet = validSheet();
            sheet[0] = rubber({ rubberNumber: 1, outcomeType: 'walkover', sets: [] });
            expect(validateScoresheet(format, layout, sheet, rosters)).toEqual([
                'Rubber 1: a rubber with outcome walkover needs a winner',
            ]);
        });

        it('requires a winner for a retirement', () => {
            const sheet = validSheet();
            sheet[0] = rubber({
                rubberNumber: 1,
                outcomeType: 'retired',
                sets: [{ setNumber: 1, homeGames: 3, awayGames: 1, isMatchTiebreak: false, isComplete: false }],
            });
            expect(validateScoresheet(format, layout, sheet, rosters)).toEqual([
                'Rubber 1: a rubber with outcome retired needs a winner',
            ]);
        });

        it('accepts a retirement with a winner', () => {
            const sheet = validSheet();
            sheet[0] = rubber({
                rubberNumber: 1,
                outcomeType: 'retired',
                winner: 'home',
                sets: [{ setNumber: 1, homeGames: 3, awayGames: 1, isMatchTiebreak: false, isComplete: false }],
            });
            expect(validateScoresheet(format, layout, sheet, rosters)).toEqual([]);
        });

        it('rejects a winner on a normal rubber', () => {
            const sheet = validSheet();
            sheet[0] = rubber({ rubberNumber: 1, winner: 'home' });
            expect(validateScoresheet(format, layout, sheet, rosters)).toEqual([
                'Rubber 1: a rubber with outcome normal must not have a winner',
            ]);
        });

        it('rejects a winner on an incomplete rubber', () => {
            const sheet = validSheet();
            sheet[0] = rubber({
                rubberNumber: 1,
                outcomeType: 'incomplete',
                winner: 'home',
                sets: [{ setNumber: 1, homeGames: 3, awayGames: 1, isMatchTiebreak: false, isComplete: false }],
            });
            expect(validateScoresheet(format, layout, sheet, rosters)).toEqual([
                'Rubber 1: a rubber with outcome incomplete must not have a winner',
            ]);
        });
    });

    describe('set scores', () => {
        it('prefixes score errors with the rubber number', () => {
            const sheet = validSheet();
            sheet[1] = rubber({
                rubberNumber: 2,
                homePlayerIds: ['h2'],
                awayPlayerIds: ['a2'],
                sets: [
                    { setNumber: 1, homeGames: 8, awayGames: 2, isMatchTiebreak: false },
                    { setNumber: 2, homeGames: 6, awayGames: 3, isMatchTiebreak: false },
                ],
            });
            expect(validateScoresheet(format, layout, sheet, rosters)).toEqual([
                'Rubber 2: Illegal set score: 8-2',
            ]);
        });

        it('rejects sets on a walkover', () => {
            const sheet = validSheet();
            sheet[0] = rubber({ rubberNumber: 1, outcomeType: 'walkover', winner: 'home' });
            expect(validateScoresheet(format, layout, sheet, rosters)).toEqual([
                'Rubber 1: A walkover rubber has no sets',
            ]);
        });

        it('passes tiebreak scores given as null or left out', () => {
            const sheet = validSheet();
            sheet[0] = rubber({
                rubberNumber: 1,
                sets: [
                    { setNumber: 1, homeGames: 6, awayGames: 4, isMatchTiebreak: false, homeTiebreakPoints: null, awayTiebreakPoints: null },
                    { setNumber: 2, homeGames: 7, awayGames: 6, isMatchTiebreak: false, homeTiebreakPoints: 7, awayTiebreakPoints: 3 },
                ],
            });
            expect(validateScoresheet(format, layout, sheet, rosters)).toEqual([]);
        });
    });

    it('reports every problem in one pass', () => {
        const sheet = [
            rubber({ rubberNumber: 1, homePlayerIds: ['nobody'] }),
            rubber({ rubberNumber: 2, outcomeType: 'walkover', sets: [] }),
        ];
        expect(validateScoresheet(format, layout, sheet, rosters)).toEqual([
            'Rubber 3: missing',
            'Rubber 1: player nobody is not on the home team',
            'Rubber 2: a rubber with outcome walkover needs a winner',
        ]);
    });
});
