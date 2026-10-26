import { RubberScore, SetScore } from './types';
    
export function summariseRubber(sets: SetScore[]) : RubberScore {
    let homeSetsWon = 0;
    let awaySetsWon = 0;
    let homeGamesWon = 0;
    let awayGamesWon = 0;
    for (const set of sets) {
        // A set stopped part-way (retirement / incomplete rubber) still has games counted
        if (set.isComplete === false) {
            homeGamesWon += set.homeGames;
            awayGamesWon += set.awayGames;
            continue;
        }
        if (set.homeGames > set.awayGames) {
            homeSetsWon++;
        } else if (set.awayGames > set.homeGames) {
            awaySetsWon++;
        }
        else {
            continue;
        }
        homeGamesWon += set.homeGames;
        awayGamesWon += set.awayGames;
    }
    return {
        homeSetsWon,
        awaySetsWon,
        homeGamesWon,
        awayGamesWon
    };
}