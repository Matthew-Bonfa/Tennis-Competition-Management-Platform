export interface LadderRow {
    teamId: number;
    teamName: string;
    matchesPlayed: number;
    matchesWon: number;
    matchesLost: number;
    setsWon: number;
    setsLost: number;
    gamesWon: number;
    gamesLost: number;
}

export interface RoundSummary {
    roundNumber: number;
    label: string; // "R1", "R2", etc.
    matchCount: number;
    firstMatchDate: string | null;
    allComplete: boolean;
}