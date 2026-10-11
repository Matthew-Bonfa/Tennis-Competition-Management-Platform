import { IsDateString, IsNotEmpty, IsString } from "class-validator";

export class CreateSeasonDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  competitionId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}