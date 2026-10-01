import type { CsvColumn } from '../common/csv.js';
import type { LadderRow } from './types.js';

export interface LadderCsvRow extends Omit<LadderRow, 'percentage'> {
    percentage: string;
}

export const LADDER_CSV_COLUMNS: CsvColumn<LadderCsvRow>[] = [
    { key: 'position', header: 'Position' },
    { key: 'teamName', header: 'Team' },
    { key: 'matchesPlayed', header: 'Played' },
    { key: 'matchesWon', header: 'Won' },
    { key: 'matchesDrawn', header: 'Drawn' },
    { key: 'matchesLost', header: 'Lost' },
    { key: 'rubbersWon', header: 'Rubbers For' },
    { key: 'rubbersLost', header: 'Rubbers Against' },
    { key: 'setsWon', header: 'Sets For' },
    { key: 'setsLost', header: 'Sets Against' },
    { key: 'gamesWon', header: 'Games For' },
    { key: 'gamesLost', header: 'Games Against' },
    { key: 'percentage', header: 'Percentage' },
    { key: 'points', header: 'Points' },
];

export function toLadderCsvRow(row: LadderRow): LadderCsvRow {
    return {
        ...row,
        // rankLadderRows yields Infinity for a team that hasn't dropped a
        // game yet - a spreadsheet has no use for that text, so blank it.
        percentage: Number.isFinite(row.percentage) ? row.percentage.toFixed(3) : '',
    };
}
