import { summariseRubber } from './summarise-rubber.js';
import type { SetScore, RubberFormat, ValidationResult } from './types.js';

function isLegalTiebreakScore(winnerPoints: number, loserPoints: number): boolean {
    if (winnerPoints === 7) {
        return loserPoints <= 5;
    }
    if (winnerPoints > 7) {
        return winnerPoints - loserPoints === 2;
    }
    return false;
}

function isLegalSetScore(format: RubberFormat, set: SetScore): boolean {
    if (set.homeGames === format.gamesPerSet && set.awayGames < format.gamesPerSet - 1) {
        return true;
    }
    if (set.awayGames === format.gamesPerSet && set.homeGames < format.gamesPerSet - 1) {
        return true;
    }

    if (set.homeGames === format.gamesPerSet + 1 && set.awayGames === set.homeGames - 2) {
        return true;
    }
    if (set.awayGames === format.gamesPerSet + 1 && set.homeGames === set.awayGames - 2) {
        return true;
    }

    if (format.tiebreakAtGames !== null && set.homeTiebreakPoints != null && set.awayTiebreakPoints != null && set.homeGames === format.tiebreakAtGames + 1 && set.awayGames === format.tiebreakAtGames && isLegalTiebreakScore(set.homeTiebreakPoints, set.awayTiebreakPoints)) {
        return true;
    }
    if (format.tiebreakAtGames !== null && set.awayTiebreakPoints != null && set.homeTiebreakPoints != null && set.awayGames === format.tiebreakAtGames + 1 && set.homeGames === format.tiebreakAtGames && isLegalTiebreakScore(set.awayTiebreakPoints, set.homeTiebreakPoints)) {
        return true;
    }

    return false;
}

export function validateRubber(format: RubberFormat, sets: SetScore[]): ValidationResult {
    const errors: string[] = [];

    if (sets.length > format.setsToWin * 2 - 1) {
        errors.push('Too many sets');
        return { isValid: false, errors };
    }

    if (sets.length < format.setsToWin) {
        errors.push('Not enough sets');
        return { isValid: false, errors };
    }

    for (let i=0; i < sets.length; i++) {
        const set = sets[i];
        const priorSets = sets.slice(0, i);
        const priorScore = summariseRubber(priorSets);

        if (priorScore.homeSetsWon >= format.setsToWin || priorScore.awaySetsWon >= format.setsToWin) {
            errors.push(`Set ${set.setNumber} played after match was already won`);
        }

        if (!isLegalSetScore(format, set)) {
            errors.push(`Illegal set score: ${set.homeGames}-${set.awayGames}`);
        }
    }

    return { isValid: errors.length === 0, errors };
}