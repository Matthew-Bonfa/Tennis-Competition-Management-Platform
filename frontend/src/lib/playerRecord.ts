// Types and pure helpers for the player win/loss record returned by
// GET /players/:id/record (see backend/src/players/types.ts for the
// source of truth these mirror).
//
// The backend returns every (year, rubberType) bucket the player has a
// result in, plus the full set of years/rubberTypes to populate filter
// controls with. The frontend never re-fetches per filter change — it
// just sums whichever buckets match the active year/discipline selection.
// sumTotals/winPercentage here are deliberately small duplicates of the
// backend's (backend/src/players/summarise-player-record.ts) rather than
// a shared package, since the frontend can't import from backend/.

export type RubberType = 'singles' | 'doubles' | 'mixed_doubles';

export interface RecordTotals {
  played: number;
  won: number;
  lost: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
}

export interface RecordBucket extends RecordTotals {
  year: number;
  rubberType: RubberType;
}

export interface PlayerRecord {
  buckets: RecordBucket[];
  years: number[];
  rubberTypes: RubberType[];
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

// Sums any subset of buckets into one total. Returns all zeros for an
// empty selection instead of letting a later divide produce NaN.
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

// Win percentage, 0-100, rounded to one decimal. 0 for an unplayed
// selection rather than NaN, so an empty filter result renders "0.0%"
// instead of breaking the page.
export function winPercentage(totals: RecordTotals): number {
  if (totals.played === 0) {
    return 0;
  }
  return Math.round((totals.won / totals.played) * 1000) / 10;
}

export const RUBBER_TYPE_LABELS: Record<RubberType, string> = {
  singles: 'Singles',
  doubles: 'Doubles',
  mixed_doubles: 'Mixed Doubles',
};
