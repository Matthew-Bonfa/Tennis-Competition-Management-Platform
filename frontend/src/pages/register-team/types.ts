// Shared response shapes for the team-registration flow.
// These describe the JSON returned by the API and are types only — they have no
// runtime effect and do not change any request or state behaviour.

/** Anything the API returns as an id + display name pair (clubs, competitions). */
export interface NamedRef {
  id: string;
  name: string;
}

export interface Season {
  id: string;
  name: string;
  competitionId: string;
  startDate: string;
}

export interface Section {
  id: string;
  name: string;
  formatId: string;
}

export interface Format {
  id: string;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  permittedGenders: string[];
  /** Some older format records only carry `min`; the UI falls back to it. */
  min?: number;
}

/** The player search endpoint and `/players/:id` return either casing. */
export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  first_name?: string;
  last_name?: string;
  name?: string;
}

/** A team registration request as returned by `/teams/requests/seasons/:id`. */
export interface TeamRequest {
  id: string;
  name?: string;
  teamName?: string;
  clubName?: string;
  division?: string;
  seasonId: string;
  competitionId?: string;
  formatId: string;
  clubId: string;
  teamId?: string;
  teamGender?: string;
  sectionComment?: string;
  pending?: boolean;
  players?: { personId: string }[];
}
