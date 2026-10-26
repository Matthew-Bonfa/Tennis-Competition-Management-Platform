import { describe, it, expect } from 'vitest';
import { toTeamDetail } from './to-team-detail.js';

function teamRow(overrides: Partial<Parameters<typeof toTeamDetail>[0]> = {}) {
  return {
    id: 1,
    name: 'Kilsyth A',
    teamGender: 'open' as const,
    club: { id: 'club-1', name: 'Kilsyth Tennis Club' },
    section: {
      id: 10,
      name: 'Section 1',
      season: {
        id: 100,
        name: 'Summer 2025/26',
        competition: {
          id: 'comp-1',
          name: 'Pennant',
          association: { id: 'assoc-1', name: 'Eastern Region' },
        },
      },
    },
    players: [
      { person: { id: 'p-2', firstName: 'Zoe', lastName: 'Adams' } },
      { person: { id: 'p-1', firstName: 'Jack', lastName: 'Thompson' } },
    ],
    ...overrides,
  };
}

describe('toTeamDetail', () => {
  it('flattens the competition chain onto the team', () => {
    const detail = toTeamDetail(teamRow());

    expect(detail).toMatchObject({
      id: 1,
      name: 'Kilsyth A',
      teamGender: 'open',
      clubId: 'club-1',
      clubName: 'Kilsyth Tennis Club',
      sectionId: 10,
      sectionName: 'Section 1',
      seasonId: 100,
      seasonName: 'Summer 2025/26',
      competitionId: 'comp-1',
      competitionName: 'Pennant',
      associationId: 'assoc-1',
      associationName: 'Eastern Region',
    });
  });

  it('maps each player to personId/firstName/lastName', () => {
    const detail = toTeamDetail(teamRow());

    expect(detail.players).toEqual([
      { personId: 'p-2', firstName: 'Zoe', lastName: 'Adams' },
      { personId: 'p-1', firstName: 'Jack', lastName: 'Thompson' },
    ]);
  });

  it('returns an empty roster for a team with no players', () => {
    const detail = toTeamDetail(teamRow({ players: [] }));
    expect(detail.players).toEqual([]);
  });

  it('passes a null teamGender through unchanged', () => {
    const detail = toTeamDetail(teamRow({ teamGender: null }));
    expect(detail.teamGender).toBeNull();
  });
});
