import type { LadderRow } from './types.js';

// The raw per-team accumulation before ranking is applied — everything
// calculateLadder tallies while it walks the section's completed matches.
export type LadderAccumulator = Omit<LadderRow, 'position' | 'percentage'>;

// Pure so it can be unit-tested without touching the database: takes the
// accumulated stats for every team in a section and produces the final,
// ordered ladder with games percentage and position filled in.
export function rankLadderRows(rows: LadderAccumulator[]): LadderRow[] {
    const ranked: LadderRow[] = rows.map((row) => ({
        ...row,
        // Guard the divide-by-zero case for a team that hasn't dropped a
        // game yet (or hasn't played at all) instead of producing NaN.
        percentage: row.gamesLost === 0 ? (row.gamesWon === 0 ? 0 : Infinity) : row.gamesWon / row.gamesLost,
        position: 0,
    }));

    ranked.sort((a, b) =>
        (b.points - a.points)
        || (b.percentage - a.percentage)
        || ((b.setsWon - b.setsLost) - (a.setsWon - a.setsLost)),
    );

    ranked.forEach((row, index) => {
        row.position = index + 1;
    });

    return ranked;
}
