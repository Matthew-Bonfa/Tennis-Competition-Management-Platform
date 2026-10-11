import { CreateCompetitionDto } from "./create-competition.dto.js";
import { PartialType } from "@nestjs/mapped-types";

// updates competition where no one field is required
export class UpdateCompetitionDto extends PartialType(CreateCompetitionDto) {}