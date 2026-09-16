import type { ClubDetail } from './types.js';

type PersonRef = { id: string; firstName: string; lastName: string };

type ClubRow = {
    id: string;
    name: string;
    isFinancialMember: boolean;
    contactPerson: PersonRef | null;
    associations: { association: { id: string; name: string } }[];
    teams: { id: number; name: string; section: { id: number; name: string } }[];
    memberships: { person: PersonRef; isPrimaryClub: boolean; isFinancialMember: boolean }[];
    roles: { person: PersonRef; role: string }[];
};

export function toClubDetail(club: ClubRow): ClubDetail {
    return {
        id: club.id,
        name: club.name,
        isFinancialMember: club.isFinancialMember,
        teamCount: club.teams.length,
        memberCount: club.memberships.length,
        contactPerson: club.contactPerson,
        associations: club.associations.map((ac) => ac.association),
        teams: club.teams.map((t) => ({
            id: t.id,
            name: t.name,
            sectionId: t.section.id,
            sectionName: t.section.name,
        })),
        members: club.memberships.map((m) => ({
            personId: m.person.id,
            firstName: m.person.firstName,
            lastName: m.person.lastName,
            isPrimaryClub: m.isPrimaryClub,
            isFinancialMember: m.isFinancialMember,
        })),
        officials: club.roles.map((r) => ({
            personId: r.person.id,
            firstName: r.person.firstName,
            lastName: r.person.lastName,
            role: r.role,
        })),
    };
}
