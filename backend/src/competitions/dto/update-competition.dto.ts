import { OmitType, PartialType } from "@nestjs/mapped-types";
import { CreateCompetitionDto } from "./create-competition.dto.js";

export class UpdateCompetitionDto extends PartialType(
  OmitType(CreateCompetitionDto, ["associationId"] as const),
) {}