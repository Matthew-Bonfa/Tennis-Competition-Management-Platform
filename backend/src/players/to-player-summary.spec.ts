import { describe, it, expect } from 'vitest';
import { primaryClubName, toPlayerSummary } from './to-player-summary.js';

describe('primaryClubName', () => {
  it('picks the membership flagged as primary', () => {
    const name = primaryClubName([
      { isPrimaryClub: false, club: { name: 'Second Club' } },
      { isPrimaryClub: true, club: { name: 'Main Club' } },
    ]);
    expect(name).toBe('Main Club');
  });

  it('falls back to the first membership when none is primary', () => {
    const name = primaryClubName([{ isPrimaryClub: false, club: { name: 'Only Club' } }]);
    expect(name).toBe('Only Club');
  });

  it('returns null for a player with no club membership', () => {
    expect(primaryClubName([])).toBeNull();
  });
});

describe('toPlayerSummary', () => {
  it('maps a person row into a PlayerSummary', () => {
    expect(
      toPlayerSummary({
        id: 'p1',
        personCode: 'P001',
        firstName: 'Jack',
        lastName: 'Thompson',
        clubMemberships: [{ isPrimaryClub: true, club: { name: 'Riverside Tennis Club' } }],
      }),
    ).toEqual({
      id: 'p1',
      personCode: 'P001',
      firstName: 'Jack',
      lastName: 'Thompson',
      primaryClubName: 'Riverside Tennis Club',
    });
  });
});
