import { Type } from 'class-transformer';
import {
    ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsIn, IsInt,
    IsNotEmpty, IsOptional, IsString, MaxLength, Min, ValidateNested,
} from 'class-validator';

export const OUTCOME_TYPES = ['normal', 'retired', 'walkover', 'incomplete', 'not_played'] as const;

export class SetScoreDto {
    @IsInt() @Min(1) setNumber: number;
    @IsInt() @Min(0) homeGames: number;
    @IsInt() @Min(0) awayGames: number;
    @IsOptional() @IsInt() @Min(0) homeTiebreakPoints?: number | null;
    @IsOptional() @IsInt() @Min(0) awayTiebreakPoints?: number | null;
    @IsBoolean() isMatchTiebreak: boolean;
    @IsOptional() @IsBoolean() isComplete?: boolean;
}

export class RubberResultDto {
    @IsInt() @Min(1) rubberNumber: number;
    @IsIn(OUTCOME_TYPES) outcomeType: (typeof OUTCOME_TYPES)[number];
    @IsOptional() @IsIn(['home', 'away']) winner?: 'home' | 'away';

    @IsArray() @ArrayMaxSize(2) @IsString({ each: true }) homePlayerIds: string[];
    @IsArray() @ArrayMaxSize(2) @IsString({ each: true }) awayPlayerIds: string[];

    @IsArray() @ArrayMaxSize(5) @ValidateNested({ each: true }) @Type(() => SetScoreDto)
    sets: SetScoreDto[];
}

export class SubmitResultDto {
    @IsArray() @ArrayMinSize(1) @ArrayMaxSize(20)
    @ValidateNested({ each: true }) @Type(() => RubberResultDto)
    rubbers: RubberResultDto[];
}

export class DisputeResultDto {
    @IsString() @IsNotEmpty() @MaxLength(500) reason: string;
}
