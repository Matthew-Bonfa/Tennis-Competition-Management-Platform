export type Side = 'home' | 'away';
export type RubberType = 'singles' | 'doubles' | 'mixed_doubles';
export type OutcomeType = 'normal' | 'retired' | 'walkover' | 'incomplete' | 'not_played';

export interface FormatRules {
  setsToWin: number;
  gamesPerSet: number;
  tiebreakAtGames: number | null;
  finalSetMatchTiebreak: boolean;
}

export interface RosterPlayer {
  personId: string;
  firstName: string;
  lastName: string;
}

// GET /matches/:id/result-form
export interface ResultForm {
  matchId: string;
  matchStatus: string;
  // null means the viewer is an association admin rather than a player
  viewerSide: Side | null;
  enteredBySide: Side | null;
  disputeReason: string | null;
  format: FormatRules;
  rubbers: { rubberNumber: number; rubberType: RubberType }[];
  homeTeam: { id: number; players: RosterPlayer[] };
  awayTeam: { id: number; players: RosterPlayer[] };
}

// The parts of GET /matches/:id that draftFromMatch reads
export interface MatchSet {
  setNumber: number;
  homeGames: number;
  awayGames: number;
  homeTiebreakPoints: number | null;
  awayTiebreakPoints: number | null;
  isMatchTiebreak: boolean;
  isComplete?: boolean;
}

export interface MatchRubber {
  rubberNumber: number;
  outcomeType: OutcomeType;
  winningTeamId: number | null;
  sets: MatchSet[];
  players: { personId: string; teamId: number }[];
}

export interface MatchWithRubbers {
  homeTeam: { id: number };
  awayTeam: { id: number };
  rubbers: MatchRubber[];
}

// One set while it is being edited
export interface SetDraft {
  home: string;
  away: string;
  homeTb: string;
  awayTb: string;
}

export interface RubberDraft {
  rubberNumber: number;
  rubberType: RubberType;
  outcomeType: OutcomeType;
  winner: Side | '';
  homePlayerIds: string[];
  awayPlayerIds: string[];
  sets: SetDraft[];
}

// The body for POST /matches/:id/result
export interface ScoresheetPayload {
  rubbers: {
    rubberNumber: number;
    outcomeType: OutcomeType;
    winner?: Side;
    homePlayerIds: string[];
    awayPlayerIds: string[];
    sets: {
      setNumber: number;
      homeGames: number;
      awayGames: number;
      homeTiebreakPoints: number | null;
      awayTiebreakPoints: number | null;
      isMatchTiebreak: boolean;
      isComplete: boolean;
    }[];
  }[];
}
