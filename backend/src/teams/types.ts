import type { LadderRow } from '../sections/types.js';

export interface TeamPlayer {
    personId: string;
    firstName: string;
    lastName: string;
}

export interface TeamDetail {
    id: number;
    name: string;
    teamGender: string | null;
    clubId: string;
    clubName: string;
    sectionId: number;
    sectionName: string;
    seasonId: number;
    seasonName: string;
    competitionId: string;
    competitionName: string;
    associationId: string;
    associationName: string;
    players: TeamPlayer[];
}

export interface TeamRecord extends LadderRow {
    sectionId: number;
    sectionName: string;
    winPercentage: number;
}