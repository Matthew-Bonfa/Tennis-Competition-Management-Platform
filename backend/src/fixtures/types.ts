export const FixtureStatusFilter = {
    all: 'all',
    upcoming: 'upcoming',
    results: 'results',
} as const;
export type FixtureStatusFilter = (typeof FixtureStatusFilter)[keyof typeof FixtureStatusFilter];

export interface FixtureQuery {
    teamId?: number;
    sectionId?: number;
    status: FixtureStatusFilter;
}

export type MatchStatus = 'scheduled' | 'completed' | 'washout' | 'forfeit' | 'bye';

export interface FixtureTeam {
    id: number;
    name: string;
    clubId: string;
    clubName: string;
}

export interface FixtureResult {
    homeRubbersWon: number;
    awayRubbersWon: number;
    winner: 'home' | 'away' | 'draw';
}

export interface Fixture {
    matchId: string;
    sectionId: number;
    roundNumber: number;
    matchDate: string;
    status: MatchStatus;
    homeTeam: FixtureTeam;
    awayTeam: FixtureTeam;
    result: FixtureResult | null;
}
