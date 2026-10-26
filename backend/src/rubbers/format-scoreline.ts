import type { SetScore } from './types.js';

function formatSetScore(set: SetScore): string {
    if (set.isMatchTiebreak) {
        return `[${set.homeTiebreakPoints}-${set.awayTiebreakPoints}]`;
    }

    if (set.homeTiebreakPoints !== null && set.awayTiebreakPoints !== null) {
        if (set.awayGames < set.homeGames) {
            return `${set.homeGames}-${set.awayGames}(${set.awayTiebreakPoints})`;
        }
        else {
            return `${set.homeGames}-${set.awayGames}(${set.homeTiebreakPoints})`;
        }
    }

    return `${set.homeGames}-${set.awayGames}`;
}

export function formatScoreLine(sets: SetScore[]): string {
    return sets.map(formatSetScore).join(' ');
}