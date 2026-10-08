import { Temporal } from '@js-temporal/polyfill';
import type { CsvColumn } from '../common/csv.js';
import type { Fixture } from './types.js';

export interface FixtureCsvRow {
    round: number;
    date: string;
    time: string;
    location: string;
    status: string;
    homeTeam: string;
    awayTeam: string;
    homeRubbers: number | string;
    awayRubbers: number | string;
    outcome: string;
    sectionId: number;
    matchId: string;
}

export const FIXTURE_CSV_COLUMNS: CsvColumn<FixtureCsvRow>[] = [
    { key: 'round', header: 'Round' },
    { key: 'date', header: 'Date' },
    { key: 'time', header: 'Time' },
    { key: 'location', header: 'Location' },
    { key: 'status', header: 'Status' },
    { key: 'homeTeam', header: 'Home Team' },
    { key: 'awayTeam', header: 'Away Team' },
    { key: 'homeRubbers', header: 'Home Rubbers' },
    { key: 'awayRubbers', header: 'Away Rubbers' },
    { key: 'outcome', header: 'Outcome' },
    { key: 'sectionId', header: 'Section ID' },
    { key: 'matchId', header: 'Match ID' },
];

export function toFixtureCsvRow(fixture: Fixture): FixtureCsvRow {
    const zoned = Temporal.Instant.from(fixture.matchDate).toZonedDateTimeISO('Australia/Melbourne');

    let outcome = '';
    if (fixture.result) {
        outcome = fixture.result.winner === 'draw'
            ? 'Draw'
            : fixture.result.winner === 'home'
                ? fixture.homeTeam.name
                : fixture.awayTeam.name;
    }

    return {
        round: fixture.roundNumber,
        date: zoned.toPlainDate().toString(),
        time: zoned.toPlainTime().toString({ smallestUnit: 'minute' }),
        location: fixture.location ?? '',
        status: fixture.status,
        homeTeam: fixture.homeTeam.name,
        awayTeam: fixture.awayTeam.name,
        homeRubbers: fixture.result ? fixture.result.homeRubbersWon : '',
        awayRubbers: fixture.result ? fixture.result.awayRubbersWon : '',
        outcome,
        sectionId: fixture.sectionId,
        matchId: fixture.matchId,
    };
}
