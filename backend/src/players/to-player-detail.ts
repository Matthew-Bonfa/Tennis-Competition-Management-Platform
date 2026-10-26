import type { Temporal } from '@js-temporal/polyfill';
import { fromInstant } from '../common/temporal.js';
import { primaryClubName } from './to-player-summary.js';
import type { PlayerClub, PlayerCompetition, PlayerDetail } from './types.js';

type ClubRef = { id: string; name: string };
type ClubMembershipRow = { isPrimaryClub: boolean; isFinancialMember: boolean; club: ClubRef };

type AssociationRef = { id: string; name: string };
type CompetitionRow = { id: string; name: string; association: AssociationRef };
type SeasonRow = { id: number; name: string; competition: CompetitionRow };
type SectionRow = { id: number; name: string; season: SeasonRow };
type TeamRow = { id: number; name: string; club: ClubRef; section: SectionRow };
type TeamMembershipRow = { team: TeamRow };

type PersonRow = {
  id: string;
  personCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Temporal.Instant | null;
  utrId: string | null;
  tennisAustraliaNumber: string | null;
  email: string | null;
  phone: string | null;
  clubMemberships: ClubMembershipRow[];
  teamMemberships: TeamMembershipRow[];
};

// Shapes the deeply-nested Person row from PlayersService#findOnePlayer
// (clubMemberships + teamMemberships -> team -> section -> season ->
// competition -> association) into the flat PlayerDetail the frontend
// profile page consumes.
export function toPlayerDetail(person: PersonRow): PlayerDetail {
  return {
    id: person.id,
    personCode: person.personCode,
    firstName: person.firstName,
    lastName: person.lastName,
    primaryClubName: primaryClubName(person.clubMemberships),
    dateOfBirth: person.dateOfBirth ? fromInstant(person.dateOfBirth).toISOString() : null,
    utrId: person.utrId,
    tennisAustraliaNumber: person.tennisAustraliaNumber,
    email: person.email,
    phone: person.phone,
    clubs: person.clubMemberships.map(toPlayerClub),
    competitions: person.teamMemberships.map((membership) => toPlayerCompetition(membership.team)),
  };
}

function toPlayerClub(membership: ClubMembershipRow): PlayerClub {
  return {
    id: membership.club.id,
    name: membership.club.name,
    isPrimaryClub: membership.isPrimaryClub,
    isFinancialMember: membership.isFinancialMember,
  };
}

// Flattens one team membership into the full competition chain above it
// (team -> section -> season -> competition -> association) so the UI can
// link straight to any level from a single row, with no further lookups.
function toPlayerCompetition(team: TeamRow): PlayerCompetition {
  const section = team.section;
  const season = section.season;
  const competition = season.competition;
  const association = competition.association;

  return {
    teamId: team.id,
    teamName: team.name,
    clubId: team.club.id,
    clubName: team.club.name,
    sectionId: section.id,
    sectionName: section.name,
    seasonId: season.id,
    seasonName: season.name,
    competitionId: competition.id,
    competitionName: competition.name,
    associationId: association.id,
    associationName: association.name,
  };
}
