import { describe, it, expect } from 'vitest';
import { summarisePlayerRecord, sumTotals, winPercentage } from './summarise-player-record.js';
import type { PlayerRubberRow } from './summarise-player-record.js';

// A straightforward straight-sets rubber: 6-4 6-3 to the home side.
const straightSetsHome = [
  { setNumber: 1, homeGames: 6, awayGames: 4, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
  { setNumber: 2, homeGames: 6, awayGames: 3, homeTiebreakPoints: null, awayTiebreakPoints: null, isMatchTiebreak: false },
];

function row(overrides: Partial<PlayerRubberRow>): PlayerRubberRow {
  return {
    year: 2024,
    rubberType: 'singles',
    playerTeamId: 1,
    winningTeamId: 1,
    isHomeSide: true,
    sets: straightSetsHome,
    ...overrides,
  };
}

describe('summarisePlayerRecord', () => {
  it('counts a win for the player on the winning team', () => {
    const [bucket] = summarisePlayerRecord([row({ playerTeamId: 1, winningTeamId: 1 })]);
    expect(bucket).toMatchObject({ played: 1, won: 1, lost: 0 });
  });

  it('counts a loss for the player on the losing team', () => {
    const [bucket] = summarisePlayerRecord([row({ playerTeamId: 2, winningTeamId: 1 })]);
    expect(bucket).toMatchObject({ played: 1, won: 0, lost: 1 });
  });

  it('skips a rubber with no recorded winner', () => {
    expect(summarisePlayerRecord([row({ winningTeamId: null })])).toEqual([]);
  });

  it('flips sets/games onto the player\'s side when they played away', () => {
    // straightSetsHome is 6-4 6-3 from the home side; an away-side player
    // on the losing team should read 0 sets won, 7 games won (not 2/12).
    const [bucket] = summarisePlayerRecord([
      row({ playerTeamId: 2, winningTeamId: 1, isHomeSide: false }),
    ]);
    expect(bucket).toMatchObject({ setsWon: 0, setsLost: 2, gamesWon: 7, gamesLost: 12 });
  });

  it('buckets separately by year', () => {
    const buckets = summarisePlayerRecord([
      row({ year: 2023 }),
      row({ year: 2024 }),
    ]);
    expect(buckets).toHaveLength(2);
    expect(buckets.map((b) => b.year)).toEqual([2024, 2023]); // descending
  });

  it('buckets separately by rubber type within the same year', () => {
    const buckets = summarisePlayerRecord([
      row({ rubberType: 'singles' }),
      row({ rubberType: 'doubles' }),
    ]);
    expect(buckets).toHaveLength(2);
    expect(buckets.map((b) => b.rubberType).sort()).toEqual(['doubles', 'singles']);
  });

  it('accumulates multiple rubbers into the same bucket', () => {
    const [bucket] = summarisePlayerRecord([
      row({ playerTeamId: 1, winningTeamId: 1 }), // win
      row({ playerTeamId: 1, winningTeamId: 2 }), // loss
    ]);
    expect(bucket).toMatchObject({ played: 2, won: 1, lost: 1 });
  });
});

describe('sumTotals', () => {
  it('returns all zeros for an empty selection', () => {
    expect(sumTotals([])).toEqual({
      played: 0, won: 0, lost: 0, setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0,
    });
  });

  it('sums several buckets together', () => {
    const buckets = summarisePlayerRecord([
      row({ year: 2023, playerTeamId: 1, winningTeamId: 1 }),
      row({ year: 2024, playerTeamId: 1, winningTeamId: 2 }),
    ]);
    expect(sumTotals(buckets)).toMatchObject({ played: 2, won: 1, lost: 1 });
  });
});

describe('winPercentage', () => {
  it('is 0 for an unplayed selection, not NaN', () => {
    expect(winPercentage(sumTotals([]))).toBe(0);
  });

  it('rounds to one decimal place', () => {
    expect(winPercentage({ ...sumTotals([]), played: 3, won: 1 })).toBe(33.3);
  });
});
