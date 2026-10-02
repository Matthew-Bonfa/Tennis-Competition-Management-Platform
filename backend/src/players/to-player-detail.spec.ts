import { Temporal } from '@js-temporal/polyfill';
import { describe, it, expect } from 'vitest';
import { toPlayerDetail } from './to-player-detail.js';

describe('toPlayerDetail', () => {
  it('flattens club memberships and the competition chain above each team', () => {
    const detail = toPlayerDetail({
      id: 'p1',
      personCode: 'P001',
      firstName: 'Jack',
      lastName: 'Thompson',
      dateOfBirth: Temporal.Instant.from('2001-03-15T00:00:00Z'),
      utrId: 'UTR100001',
      tennisAustraliaNumber: 'TA100001',
      clubMemberships: [
        { isPrimaryClub: true, isFinancialMember: true, club: { id: 'c1', name: 'Riverside Tennis Club' } },
      ],
      teamMemberships: [
        {
          team: {
            id: 1,
            name: 'Riverside 1',
            club: { id: 'c1', name: 'Riverside Tennis Club' },
            section: {
              id: 10,
              name: 'Section A',
              season: {
                id: 100,
                name: 'Summer 2024',
                competition: {
                  id: 'comp1',
                  name: 'Pennant',
                  association: { id: 'assoc1', name: 'City Association' },
                },
              },
            },
          },
        },
      ],
    });

    expect(detail.dateOfBirth).toBe('2001-03-15T00:00:00.000Z');
    expect(detail.primaryClubName).toBe('Riverside Tennis Club');
    expect(detail.clubs).toEqual([
      { id: 'c1', name: 'Riverside Tennis Club', isPrimaryClub: true, isFinancialMember: true },
    ]);
    expect(detail.competitions).toEqual([
      {
        teamId: 1,
        teamName: 'Riverside 1',
        clubId: 'c1',
        clubName: 'Riverside Tennis Club',
        sectionId: 10,
        sectionName: 'Section A',
        seasonId: 100,
        seasonName: 'Summer 2024',
        competitionId: 'comp1',
        competitionName: 'Pennant',
        associationId: 'assoc1',
        associationName: 'City Association',
      },
    ]);
  });

  it('returns null for dateOfBirth and an empty list for a player with no teams', () => {
    const detail = toPlayerDetail({
      id: 'p2',
      personCode: 'P002',
      firstName: 'Daniel',
      lastName: 'Wilson',
      dateOfBirth: null,
      utrId: null,
      tennisAustraliaNumber: null,
      clubMemberships: [],
      teamMemberships: [],
    });

    expect(detail.dateOfBirth).toBeNull();
    expect(detail.primaryClubName).toBeNull();
    expect(detail.clubs).toEqual([]);
    expect(detail.competitions).toEqual([]);
  });
});
