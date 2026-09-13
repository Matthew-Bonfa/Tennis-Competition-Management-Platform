export interface RubberFormat {
    setsToWin: number;
    gamesPerSet: number;
    tiebreakAtGames: number | null;
    finalSetMatchTiebreak: boolean;
}

export interface SetScore {
    setNumber: number;
    homeGames: number;
    awayGames: number;
    isMatchTiebreak: boolean;
    homeTiebreakPoints: number | null;
    awayTiebreakPoints: number | null;
}

export interface RubberScore {
    homeSetsWon: number;
    awaySetsWon: number;
    homeGamesWon: number;
    awayGamesWon: number;
}

export type ValidationResult = string[];