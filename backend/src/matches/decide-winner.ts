import { summariseRubber } from "../rubbers/summarise-rubber.js";
import type { OutcomeType, SetScore } from "../rubbers/types.js";

export type Side = 'home' | 'away';

export type WinnerRule = 'sets_then_games' | 'rubbers_then_sets' | 'ladder_position';

// Totals for a whole match, as [home, away] pairs.
export type Tally = { rubbers: [number, number]; sets: [number, number]; games: [number, number] };

// Works out who won a single rubber
export function decideWinner(outcome: OutcomeType, sets: SetScore[], claimedWinner: Side | null,): Side | null {
    if (outcome === 'incomplete' || outcome === 'not_played') {
        return null;
    }
    if (outcome === 'retired' || outcome === 'walkover') {
        return claimedWinner;
    }
    const summary = summariseRubber(sets);
    if (summary.homeSetsWon === summary.awaySetsWon) {
        return null;
    }
    if (summary.homeSetsWon > summary.awaySetsWon) {
        return 'home';
    }
    return 'away';
}

// Compares one [home, away] pair, returning the side with more, or null if level.
function higher([home, away]: [number, number]): Side | null {
    if (home === away) {
        return null;
    }
    return home > away ? 'home' : 'away';
}

// Works out who won the whole match, using the format's tiebreak order
export function decideMatchWinner(rule: WinnerRule, tally: Tally): Side | null {
    if (rule === 'ladder_position') {
        throw new Error('ladder_position matches cannot be decided from the scoresheet');
    }
    if (rule === 'rubbers_then_sets') {
        return higher(tally.rubbers) ?? higher(tally.sets) ?? higher(tally.games);
    }
    return higher(tally.sets) ?? higher(tally.games);
}
