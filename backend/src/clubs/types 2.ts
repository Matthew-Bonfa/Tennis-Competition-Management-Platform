export interface ClubSummary {
    id: string;
    name: string;
    isFinancialMember: boolean;
    teamCount: number;
    memberCount: number;
}

export interface ClubContact {
    id: string;
    firstName: string;
    lastName: string;
}

export interface ClubAssociation {
    id: string;
    name: string;
}

export interface ClubTeam {
    id: number;
    name: string;
    sectionId: number;
    sectionName: string;
}

export interface ClubMember {
    personId: string;
    firstName: string;
    lastName: string;
    isPrimaryClub: boolean;
    isFinancialMember: boolean;
}

export interface ClubOfficial {
    personId: string;
    firstName: string;
    lastName: string;
    role: string;
}

export interface ClubDetail extends ClubSummary {
    contactPerson: ClubContact | null;
    associations: ClubAssociation[];
    teams: ClubTeam[];
    members: ClubMember[];
    officials: ClubOfficial[];
}
