export const RubberTypeValues = {
  Singles: 'singles',
  Doubles: 'doubles',
  MixedDoubles: 'mixed_doubles',
} as const;
export type RubberType = (typeof RubberTypeValues)[keyof typeof RubberTypeValues];

export interface PlayerSummary {
  id: string;
  personCode: string;
  firstName: string;
  lastName: string;
  primaryClubName: string | null;
}

export interface PlayerClub {
  id: string;
  name: string;
  isPrimaryClub: boolean;
  isFinancialMember: boolean;
}

export interface PlayerCompetition {
  teamId: number;
  teamName: string;
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
}

export interface PlayerDetail extends PlayerSummary {
  dateOfBirth: string | null; 
  utrId: string | null;
  tennisAustraliaNumber: string | null;
  clubs: PlayerClub[];
  competitions: PlayerCompetition[];
  email: string | null;
  phone: string | null;
}

export interface RecordTotals {
  played: number;
  won: number;
  lost: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
}

// Totals for one (year, rubberType) combination the player has a result in.
export interface RecordBucket extends RecordTotals {
  year: number;
  rubberType: RubberType;
}

export interface PlayerRecord {
  buckets: RecordBucket[];
  years: number[]; 
  rubberTypes: RubberType[]; 
}
