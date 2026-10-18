// file created by Ella Goodwin
// AI was used in writing this file (Claude)

import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateFormatDto } from './dto/create-format.dto.js';
import { formatNameFromRubbers } from './format-name.js';

@Injectable()
export class FormatsService {
  constructor(private prisma: PrismaService) {}

  // list all formats, for dropdowns
  async findAll() {
    const formats = await this.prisma.client.orm.public.Format.all();

    return formats.map((format) => ({
      id: format.id,
      name: format.name,
    }));
  }

  // one format with its rubbers (in order) and permitted genders
  async findOne(id: string) {
    const format = await this.prisma.client.orm.public.Format
      .where({ id })
      .include('rubbers', (rubber) => rubber.orderBy((r) => r.rubberNumber.asc()))
      .include('permittedGenders', (gender) => gender.orderBy((g) => g.id.asc()))
      .first();

    // if nothing was found, send back a proper "404 not found" error
    if (!format) {
      throw new NotFoundException(`Format ${id} not found`);
    }

    return {
      id: format.id,
      name: format.name,
      minPlayers: format.minPlayers,
      maxPlayers: format.maxPlayers,
      minAge: format.minAge,
      maxAge: format.maxAge,
      setsToWin: format.setsToWin,
      gamesPerSet: format.gamesPerSet,
      tiebreakAtGames: format.tiebreakAtGames,
      finalSetMatchTiebreak: format.finalSetMatchTiebreak,
      pointsPerRubber: format.pointsPerRubber,
      pointsPerMatchWin: format.pointsPerMatchWin,
      forfeitScoreline: format.forfeitScoreline,
      winnerDeterminedBy: format.winnerDeterminedBy,
      minCourts: format.minCourts,
      rubbers: format.rubbers.map((rubber) => ({
        rubberNumber: rubber.rubberNumber,
        rubberType: rubber.rubberType,
      })),
      permittedGenders: format.permittedGenders.map((g) => g.gender),
    };
  }

  // create a format, its rubbers and its permitted genders together
  async create(createFormatDto: CreateFormatDto) {
    if (createFormatDto.maxPlayers < createFormatDto.minPlayers) {
      throw new BadRequestException('maxPlayers cannot be less than minPlayers');
    }
    if (
      createFormatDto.minAge != null &&
      createFormatDto.maxAge != null &&
      createFormatDto.maxAge < createFormatDto.minAge
    ) {
      throw new BadRequestException('maxAge cannot be less than minAge');
    }

    // the name is always generated from the rubbers
    const name = formatNameFromRubbers(createFormatDto.rubbers);

    // one transaction: if any insert fails, none of them are kept.
    // Every query inside must go through tx, not this.prisma.client.
    const created = await this.prisma.client.transaction(async (tx) => {
      const format = await tx.orm.public.Format.create({
        name,
        minPlayers: createFormatDto.minPlayers,
        maxPlayers: createFormatDto.maxPlayers,
        minAge: createFormatDto.minAge ?? null,
        maxAge: createFormatDto.maxAge ?? null,
        setsToWin: createFormatDto.setsToWin,
        gamesPerSet: createFormatDto.gamesPerSet,
        tiebreakAtGames: createFormatDto.tiebreakAtGames ?? null,
        finalSetMatchTiebreak: createFormatDto.finalSetMatchTiebreak ?? false,
        pointsPerRubber: createFormatDto.pointsPerRubber ?? 1,
        pointsPerMatchWin: createFormatDto.pointsPerMatchWin ?? 0,
        forfeitScoreline: createFormatDto.forfeitScoreline ?? '6-0 6-0',
        winnerDeterminedBy: createFormatDto.winnerDeterminedBy,
        minCourts: createFormatDto.minCourts,
      });

      // rubber numbers are the position in the list: 1, 2, 3...
      for (let i = 0; i < createFormatDto.rubbers.length; i++) {
        await tx.orm.public.FormatRubber.create({
          formatId: format.id,
          rubberNumber: i + 1,
          rubberType: createFormatDto.rubbers[i],
        });
      }

      for (const gender of createFormatDto.permittedGenders) {
        await tx.orm.public.FormatTeamGender.create({
          formatId: format.id,
          gender,
        });
      }

      return format;
    });

    // read it back after the transaction has committed
    return this.findOne(created.id);
  }

  // delete a format, its rubbers and its permitted genders together
  async remove(id: string) {
    // one transaction: if any delete fails, none of them are kept.
    // Every query inside must go through tx, not this.prisma.client.
    await this.prisma.client.transaction(async (tx) => {
      const format = await tx.orm.public.Format.where({ id }).select('id').first();
      if (!format) {
        throw new NotFoundException(`Format ${id} not found`);
      }

      // a format can't be deleted while a section, competition or team request uses it
      const usedBySection = await tx.orm.public.Section.where({ formatId: id }).select('id').first();
      const usedByCompetition = await tx.orm.public.CompetitionFormat.where({ formatId: id }).select('id').first();
      const usedByTeamRequest = await tx.orm.public.TeamRequest.where({ formatId: id }).select('id').first();
      if (usedBySection || usedByCompetition || usedByTeamRequest) {
        throw new ConflictException(
          `Format ${id} is in use by a section, competition or team request and cannot be deleted`,
        );
      }

      // children first, then the format itself
      await tx.orm.public.FormatRubber.where({ formatId: id }).deleteAndCount();
      await tx.orm.public.FormatTeamGender.where({ formatId: id }).deleteAndCount();
      await tx.orm.public.Format.where({ id }).delete();
    });
  }
}