import { describe, it, expect } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DisputeResultDto, SubmitResultDto } from './submit-result.dto.js';

const check = (body: unknown) =>
    validate(plainToInstance(SubmitResultDto, body), {
        whitelist: true, forbidNonWhitelisted: true,
    });

const checkDispute = (body: unknown) =>
    validate(plainToInstance(DisputeResultDto, body), {
        whitelist: true, forbidNonWhitelisted: true,
    });

function set(overrides: Record<string, unknown> = {}) {
    return { setNumber: 1, homeGames: 6, awayGames: 4, isMatchTiebreak: false, ...overrides };
}

function rubber(overrides: Record<string, unknown> = {}) {
    return {
        rubberNumber: 1,
        outcomeType: 'normal',
        homePlayerIds: ['h1'],
        awayPlayerIds: ['a1'],
        sets: [set(), set({ setNumber: 2, homeGames: 6, awayGames: 3 })],
        ...overrides,
    };
}

describe('SubmitResultDto', () => {
    it('accepts a valid body', async () => {
        expect(await check({ rubbers: [rubber()] })).toEqual([]);
    });

    it('accepts null or missing tiebreak points and an optional isComplete', async () => {
        const sets = [
            set({ homeTiebreakPoints: null, awayTiebreakPoints: null }),
            set({ setNumber: 2, homeGames: 7, awayGames: 6, homeTiebreakPoints: 7, awayTiebreakPoints: 3 }),
            set({ setNumber: 3, homeGames: 3, awayGames: 1, isComplete: false }),
        ];
        expect(await check({ rubbers: [rubber({ sets })] })).toEqual([]);
    });

    it('accepts a walkover with no sets and a winner', async () => {
        const walkover = rubber({ outcomeType: 'walkover', winner: 'home', sets: [], awayPlayerIds: [] });
        expect(await check({ rubbers: [walkover] })).toEqual([]);
    });

    it('rejects an empty rubbers list', async () => {
        expect(await check({ rubbers: [] })).not.toEqual([]);
    });

    it('rejects a body with no rubbers', async () => {
        expect(await check({})).not.toEqual([]);
    });

    it('rejects an unknown outcome type', async () => {
        expect(await check({ rubbers: [rubber({ outcomeType: 'forfeit' })] })).not.toEqual([]);
    });

    it('rejects a winner that is not home or away', async () => {
        expect(await check({ rubbers: [rubber({ winner: 'draw' })] })).not.toEqual([]);
    });

    it('rejects a rubber number below 1', async () => {
        expect(await check({ rubbers: [rubber({ rubberNumber: 0 })] })).not.toEqual([]);
    });

    it('rejects more than two players on a side', async () => {
        expect(await check({ rubbers: [rubber({ homePlayerIds: ['h1', 'h2', 'h3'] })] })).not.toEqual([]);
    });

    it('rejects player ids that are not strings', async () => {
        expect(await check({ rubbers: [rubber({ homePlayerIds: [42] })] })).not.toEqual([]);
    });

    it('rejects more than five sets in a rubber', async () => {
        const sets = Array.from({ length: 6 }, (_, i) => set({ setNumber: i + 1 }));
        expect(await check({ rubbers: [rubber({ sets })] })).not.toEqual([]);
    });

    describe('nested set scores', () => {
        it('rejects a negative game count inside a set', async () => {
            const errors = await check({ rubbers: [rubber({ sets: [set({ homeGames: -1 })] })] });
            expect(errors).not.toEqual([]);
        });

        it('rejects a game count that is not a whole number', async () => {
            const errors = await check({ rubbers: [rubber({ sets: [set({ awayGames: 3.5 })] })] });
            expect(errors).not.toEqual([]);
        });

        it('rejects a set missing isMatchTiebreak', async () => {
            const { isMatchTiebreak: _removed, ...incomplete } = set();
            expect(await check({ rubbers: [rubber({ sets: [incomplete] })] })).not.toEqual([]);
        });

        it('rejects a negative tiebreak point count', async () => {
            const errors = await check({ rubbers: [rubber({ sets: [set({ homeTiebreakPoints: -2 })] })] });
            expect(errors).not.toEqual([]);
        });

        it('reports the error under the failing rubber and set', async () => {
            const errors = await check({ rubbers: [rubber(), rubber({ rubberNumber: 2, sets: [set({ homeGames: -1 })] })] });
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('rubbers');
            expect(errors[0].children?.[0].property).toBe('1');
            expect(errors[0].children?.[0].children?.[0].property).toBe('sets');
        });
    });

    describe('unknown fields', () => {
        it('rejects an unknown field on the body', async () => {
            expect(await check({ rubbers: [rubber()], matchWinner: 'home' })).not.toEqual([]);
        });

        it('rejects an unknown field on a rubber', async () => {
            expect(await check({ rubbers: [rubber({ winningTeamId: 5 })] })).not.toEqual([]);
        });

        it('rejects an unknown field on a set', async () => {
            expect(await check({ rubbers: [rubber({ sets: [set({ extra: true })] })] })).not.toEqual([]);
        });
    });
});

describe('DisputeResultDto', () => {
    it('accepts a reason', async () => {
        expect(await checkDispute({ reason: 'Wrong score in rubber 2' })).toEqual([]);
    });

    it('rejects a missing, empty or non-string reason', async () => {
        expect(await checkDispute({})).not.toEqual([]);
        expect(await checkDispute({ reason: '' })).not.toEqual([]);
        expect(await checkDispute({ reason: 7 })).not.toEqual([]);
    });

    it('rejects a reason over 500 characters', async () => {
        expect(await checkDispute({ reason: 'x'.repeat(501) })).not.toEqual([]);
        expect(await checkDispute({ reason: 'x'.repeat(500) })).toEqual([]);
    });
});
