// ==========================================
// Shared primitives
// ==========================================

// Mirrors the contract's rubber_type enum (backend/src/prisma/contract.prisma).
// Exported as a real object (not just a type) so it can be passed straight
// into Nest's ParseEnumPipe for the ?rubberType= query param — see
// players.controller.ts.
export const RubberTypeValues = {
  Singles: 'singles',
  Doubles: 'doubles',
  MixedDoubles: 'mixed_doubles',
} as const;
export type RubberType = (typeof RubberTypeValues)[keyof typeof RubberTypeValues];

// ==========================================
// Player list — GET /players
// ==========================================

export interface PlayerSummary {
  id: string;
  personCode: string;
  firstName: string;
  lastName: string;
  // Null when the player has no club membership at all.
  primaryClubName: string | null;
}

// ==========================================
// Player profile — GET /players/:id
// ==========================================

export interface PlayerClub {
  id: string;
  name: string;
  isPrimaryClub: boolean;
  isFinancialMember: boolean;
}

// One row per team the player belongs to, carrying the whole chain up to
// the competition (and the association above that) so the profile page
// can link every level without a second round trip per row.
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
  dateOfBirth: string | null; // ISO date string, via common/temporal.ts#fromInstant
  utrId: string | null;
  tennisAustraliaNumber: string | null;
  clubs: PlayerClub[];
  competitions: PlayerCompetition[];
}

// ==========================================
// Win/loss record — GET /players/:id/record
// ==========================================

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
  // Convenience lists for the UI's filter controls, derived from the
  // player's *unfiltered* history — so narrowing `buckets` by year or
  // rubberType (see players.service.ts) never shrinks these too.
  years: number[]; // descending
  rubberTypes: RubberType[]; // only disciplines this player has actually played
}
