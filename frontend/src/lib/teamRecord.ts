export interface TeamRecord {
  teamId: number;
  teamName: string;
  position: number;
  sectionId: number;
  sectionName: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesDrawn: number;
  matchesLost: number;
  rubbersWon: number;
  rubbersLost: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
  percentage: number;
  points: number;
  winPercentage: number;
}

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
