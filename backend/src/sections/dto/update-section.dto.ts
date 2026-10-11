import { OmitType, PartialType } from "@nestjs/mapped-types";
import { CreateSectionDto } from "./create-section.dto.js";

export class UpdateSectionDto extends PartialType(
  OmitType(CreateSectionDto, ["seasonId", "formatId"] as const),
) {}