export interface LadderRow {
    teamId: number;
    teamName: string;
    position: number;
    matchesPlayed: number;
    matchesWon: number;
    matchesDrawn: number;
    matchesLost: number;
    rubbersWon: number;
    rubbersLost: number;
    setsWon: number;
    setsLost: number;
    gamesWon: number;
    gamesLost: number;
    percentage: number;
    points: number;
}

export interface RoundSummary {
    roundNumber: number;
    label: string; // "R1", "R2", etc.
    matchCount: number;
    firstMatchDate: string | null;
    allComplete: boolean;
}
