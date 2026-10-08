import { IsNotEmpty, IsString } from "class-validator";

export class CreateCompetitionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  associationId: string;
}