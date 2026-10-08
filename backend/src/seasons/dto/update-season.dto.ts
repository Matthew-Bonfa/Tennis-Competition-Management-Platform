import { OmitType, PartialType } from "@nestjs/mapped-types";
import { CreateSeasonDto } from "./create-season.dto.js";

export class UpdateSeasonDto extends PartialType(
  OmitType(CreateSeasonDto, ["competitionId"] as const),
) {}