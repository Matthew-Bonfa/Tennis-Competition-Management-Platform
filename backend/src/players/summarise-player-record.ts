import { summariseRubber } from '../rubbers/summarise-rubber.js';
import type { SetScore } from '../rubbers/types.js';
import type { RecordBucket, RecordTotals, RubberType } from './types.js';

// One row per rubber a specific player appeared in, already reduced down
// to just what this calculator needs. Kept separate from the raw Prisma
// row shape (see players.service.ts) so this function stays pure and
// unit-testable without touching the database.
export interface PlayerRubberRow {
  year: number;
  rubberType: RubberType;
  playerTeamId: number;
  winningTeamId: number | null;
  isHomeSide: boolean;
  sets: SetScore[];
}

const EMPTY_TOTALS: RecordTotals = {
  played: 0,
  won: 0,
  lost: 0,
  setsWon: 0,
  setsLost: 0,
  gamesWon: 0,
  gamesLost: 0,
};

// Turns a flat list of a player's rubbers into one bucket per (year,
// rubberType) combination they actually played, each totalling
// matches/sets/games won and lost from that player's own side of the net.
export function summarisePlayerRecord(rows: PlayerRubberRow[]): RecordBucket[] {
  const buckets = new Map<string, RecordBucket>();

  for (const row of rows) {
    // A rubber with no recorded winner (abandoned, washed out before a
    // result was reached) is neither a win nor a loss — skip it rather
    // than guessing which side it should count for.
    if (row.winningTeamId === null) {
      continue;
    }

    const key = `${row.year}:${row.rubberType}`;
    const bucket = buckets.get(key) ?? { year: row.year, rubberType: row.rubberType, ...EMPTY_TOTALS };

    const summary = summariseRubber(row.sets);
    const won = row.winningTeamId === row.playerTeamId;

    // summariseRubber reports sets/games from the home side's perspective;
    // flip the numbers onto the player's side when they played away.
    const playerSets = row.isHomeSide ? summary.homeSetsWon : summary.awaySetsWon;
    const opponentSets = row.isHomeSide ? summary.awaySetsWon : summary.homeSetsWon;
    const playerGames = row.isHomeSide ? summary.homeGamesWon : summary.awayGamesWon;
    const opponentGames = row.isHomeSide ? summary.awayGamesWon : summary.homeGamesWon;

    buckets.set(key, {
      ...bucket,
      played: bucket.played + 1,
      won: bucket.won + (won ? 1 : 0),
      lost: bucket.lost + (won ? 0 : 1),
      setsWon: bucket.setsWon + playerSets,
      setsLost: bucket.setsLost + opponentSets,
      gamesWon: bucket.gamesWon + playerGames,
      gamesLost: bucket.gamesLost + opponentGames,
    });
  }

  // Most recent year first; within a year, a stable alphabetical order for
  // the discipline so the breakdown table doesn't reshuffle between renders.
  return [...buckets.values()].sort(
    (a, b) => b.year - a.year || a.rubberType.localeCompare(b.rubberType),
  );
}

// Sums any subset of buckets (or any RecordTotals-shaped rows) into one
// total — used to answer "all years", "2024 doubles", etc. from the same
// bucket list the API returns. Returns all zeros for an empty selection
// instead of throwing or letting a later divide produce NaN.
export function sumTotals(rows: RecordTotals[]): RecordTotals {
  return rows.reduce(
    (totals, row) => ({
      played: totals.played + row.played,
      won: totals.won + row.won,
      lost: totals.lost + row.lost,
      setsWon: totals.setsWon + row.setsWon,
      setsLost: totals.setsLost + row.setsLost,
      gamesWon: totals.gamesWon + row.gamesWon,
      gamesLost: totals.gamesLost + row.gamesLost,
    }),
    { ...EMPTY_TOTALS },
  );
}

// Win percentage, 0–100, rounded to one decimal place. 0 for an unplayed
// selection rather than NaN, matching the rankLadderRows divide-by-zero
// guard in sections/rank-ladder.ts.
export function winPercentage(totals: RecordTotals): number {
  if (totals.played === 0) {
    return 0;
  }
  return Math.round((totals.won / totals.played) * 1000) / 10;
}
