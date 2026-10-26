import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateSectionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  seasonId: number;

  @IsString()
  @IsNotEmpty()
  formatId: string;

  @IsOptional()
  @IsString()
  gradeLabel?: string;
}