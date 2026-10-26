import { IsIn, IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";

export const DAYS_OF_WEEK = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export class CreateCompetitionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  associationId: string;

  @IsOptional()
  @IsIn(DAYS_OF_WEEK)
  dayOfWeek?: DayOfWeek | null;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime must be in HH:mm format' })
  startTime?: string | null;
}