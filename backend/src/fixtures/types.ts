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
    round?: number;
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
    // The stored override, or the home team's club name when none is set.
    location: string | null;
    // The home club's id when location is the default (no override), so the
    // UI can link to that club's page; null when a custom location is set.
    locationClubId: string | null;
    status: MatchStatus;
    homeTeam: FixtureTeam;
    awayTeam: FixtureTeam;
    result: FixtureResult | null;
}
