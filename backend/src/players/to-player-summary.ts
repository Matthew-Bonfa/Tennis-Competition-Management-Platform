import type { PlayerSummary } from './types.js';

type ClubMembershipRow = {
  isPrimaryClub: boolean;
  club: { name: string };
};

type PersonRow = {
  id: string;
  personCode: string;
  firstName: string;
  lastName: string;
  clubMemberships: ClubMembershipRow[];
};

// Picks the club name to show next to a player in a list: their primary
// club if they have one, otherwise whichever club membership they do
// have, else null for a player with no club membership at all. Shared by
// the list mapper below and to-player-detail.ts so both views agree on
// what "their club" means.
export function primaryClubName(memberships: ClubMembershipRow[]): string | null {
  const primary = memberships.find((m) => m.isPrimaryClub);
  return (primary ?? memberships[0])?.club.name ?? null;
}

export function toPlayerSummary(person: PersonRow): PlayerSummary {
  return {
    id: person.id,
    personCode: person.personCode,
    firstName: person.firstName,
    lastName: person.lastName,
    primaryClubName: primaryClubName(person.clubMemberships),
  };
}
