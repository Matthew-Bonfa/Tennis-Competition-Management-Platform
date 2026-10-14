// file created by Ella Goodwin
// AI was used in writing this file (Claude)

import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

// These mirror the enums in contract.prisma (the values are the stored text)
export const RUBBER_TYPES = ['singles', 'doubles', 'mixed_doubles'] as const;
export type RubberType = (typeof RUBBER_TYPES)[number];

export const TEAM_GENDERS = ['boys', 'girls', 'open'] as const;
export type TeamGender = (typeof TEAM_GENDERS)[number];

export const WINNER_RULES = [
  'sets_then_games',
  'rubbers_then_sets',
  'ladder_position',
] as const;
export type WinnerRule = (typeof WINNER_RULES)[number];

// There is no name here on purpose: the name is generated from the rubbers.
// The number of rubbers per match is the length of the rubbers list.
export class CreateFormatDto {
  // Team composition
  @IsInt()
  @Min(1)
  minPlayers: number;

  @IsInt()
  @Min(1)
  maxPlayers: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minAge?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxAge?: number | null;

  // Match format and scoring
  @IsInt()
  @Min(1)
  setsToWin: number;

  @IsInt()
  @Min(1)
  gamesPerSet: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  tiebreakAtGames?: number | null;

  @IsOptional()
  @IsBoolean()
  finalSetMatchTiebreak?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  pointsPerRubber?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  pointsPerMatchWin?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  forfeitScoreline?: string;

  @IsIn(WINNER_RULES)
  winnerDeterminedBy: WinnerRule;

  @IsInt()
  @Min(1)
  minCourts: number;

  // Which team genders can enter (at least one, no repeats)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsIn(TEAM_GENDERS, { each: true })
  permittedGenders: TeamGender[];

  // The rubbers in score-sheet order (at least one). The first is rubber 1.
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(RUBBER_TYPES, { each: true })
  rubbers: RubberType[];
}