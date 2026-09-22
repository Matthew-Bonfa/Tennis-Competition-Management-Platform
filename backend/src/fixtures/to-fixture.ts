import type { Temporal } from '@js-temporal/polyfill';
import { fromInstant } from '../common/temporal.js';
import type { Fixture, FixtureResult, FixtureTeam, MatchStatus } from './types.js';

type TeamRow = {
    id: number;
    name: string;
    club: { id: string; name: string };
};

export function toFixture(match: MatchRow): Fixture {
    return {
        matchId: match.id,
        sectionId: match.sectionId,
        roundNumber: match.roundNumber,
        matchDate: fromInstant(match.matchDate).toISOString(),
        status: match.matchStatus,
        homeTeam: toFixtureTeam(match.homeTeam),
        awayTeam: toFixtureTeam(match.awayTeam),
        result: match.matchStatus === 'completed' ? toResult(match) : null,
    };
}

function toFixtureTeam(team: TeamRow): FixtureTeam {
    return {
        id: team.id,
        name: team.name,
        clubId: team.club.id, clubName: team.club.name 
    };
}

function toResult(match: MatchRow): FixtureResult {
    const homeRubbersWon = match.rubbers.filter((r) => r.winningTeamId === match.homeTeam.id).length; 
    const awayRubbersWon = match.rubbers.filter((r) => r.winningTeamId === match.awayTeam.id).length;
    const winner = homeRubbersWon > awayRubbersWon ? 'home' : homeRubbersWon < awayRubbersWon ? 'away': 'draw';
    return { homeRubbersWon, awayRubbersWon, winner };
}

type MatchRow = {
    id: string;
    sectionId: number;
    roundNumber: number;
    matchDate: Temporal.Instant;
    matchStatus: MatchStatus;
    homeTeam: TeamRow;
    awayTeam: TeamRow;
    rubbers: { winningTeamId: number | null }[];
}