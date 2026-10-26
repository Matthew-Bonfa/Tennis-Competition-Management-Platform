import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AssociationsService } from '../associations/associations.service.js'
import { SeasonsService } from '../seasons/seasons.service.js';
import { CreateCompetitionDto } from './dto/create-competition.dto.js';
import { UpdateCompetitionDto } from './dto/update-competition.dto.js';

@Injectable()
export class CompetitionsService {

  constructor(
    private prisma: PrismaService,
    private readonly associationsService: AssociationsService,
    private readonly seasonsService: SeasonsService
  ) {}
  
  // FOR COMPETITIONS PAGE
  // get all competitions for specified association (or all competitions)
  async findAll(associationId?: string) {
    const competitions = await this.prisma.client.orm.public.Competition
      .where(associationId ? { associationId } : {})
      .all();

    // get every association to look up names
    const associations = await this.associationsService.getAll();

    // return association and competition -> relevant details
    return competitions.map((competition) => {
      // find association that matches foreign key in competition
      const association = associations.find((a) => a.id === competition.associationId);
      return {
        id: competition.id,
        name: competition.name,
        dayOfWeek: competition.dayOfWeek,
        startTime: competition.startTime,
        association: association ?? null,
      };
    });
  }

  // FOR COMPETITION (SINGULAR) PAGE  
  // find one specific competition, with its association and its seasons
  async findOne(id: string) {
    const competition = await this.prisma.client.orm.public.Competition
      .where({ id })
      .first(); // means single competition object is returned, not list with one element

    // if nothing was found, send back a proper "404 not found" error
    if (!competition) {
      throw new NotFoundException(`Competition ${id} not found`);
    }

    // look up the association this competition belongs to
    const association = await this.associationsService.getAssociation(competition.associationId)

    // get every season that belongs to this competition
    const seasons = await this.seasonsService.findAll(id)

    return {
      id: competition.id,
      name: competition.name,
      dayOfWeek: competition.dayOfWeek,
      startTime: competition.startTime,
      association: association ? { id: association.id, name: association.name } : null,
      seasons: seasons.map((season) => ({
        id: season.id,
        name: season.name,
        startDate: season.startDate,
        endDate: season.endDate,
      })),
    };
  }

  // create new competition
  async create(createCompetitionDto: CreateCompetitionDto) {
    return this.prisma.client.orm.public.Competition.create({
      name: createCompetitionDto.name,
      associationId: createCompetitionDto.associationId,
      dayOfWeek: createCompetitionDto.dayOfWeek ?? null,
      startTime: createCompetitionDto.startTime ?? null,
    });
  }

  // update competition
  async update(id: string, updateCompetitionDto: UpdateCompetitionDto) {
    // direct lookup (findOne would also fetch the association and seasons)
    const existing = await this.prisma.client.orm.public.Competition
      .where({ id })
      .first();
    if (!existing) {
      throw new NotFoundException(`Competition ${id} not found`);
    }

    const data: any = {};
    // a missing or null name is ignored, since a competition always needs one
    if (updateCompetitionDto.name != null) {
      data.name = updateCompetitionDto.name;
    }
    // for these two, null is allowed and clears the value
    if (updateCompetitionDto.dayOfWeek !== undefined) {
      data.dayOfWeek = updateCompetitionDto.dayOfWeek;
    }
    if (updateCompetitionDto.startTime !== undefined) {
      data.startTime = updateCompetitionDto.startTime;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Nothing to update');
    }

    return this.prisma.client.orm.public.Competition.where({ id }).update(data);
  }

  // hard delete a competition and everything under it: seasons, sections,
  // teams, team requests, matches and results
  async remove(id: string) {
    // one transaction: if any delete fails, none of them are kept.
    // Every query inside must go through tx, not this.prisma.client.
    await this.prisma.client.transaction(async (tx) => {
      const competition = await tx.orm.public.Competition.where({ id }).select('id').first();
      if (!competition) {
        throw new NotFoundException(`Competition ${id} not found`);
      }

      // collect the ids at each level of the hierarchy, top down
      const ids = (rows: { id: any }[]) => rows.map((row) => row.id);
      const seasonIds: number[] = ids(
        await tx.orm.public.Season.where({ competitionId: id }).select('id').all(),
      );
      const sectionIds: number[] = seasonIds.length
        ? ids(await tx.orm.public.Section.where((s) => s.seasonId.in(seasonIds)).select('id').all())
        : [];
      const teamIds: number[] = sectionIds.length
        ? ids(await tx.orm.public.Team.where((t) => t.sectionId.in(sectionIds)).select('id').all())
        : [];
      const matchIds: string[] = sectionIds.length
        ? ids(await tx.orm.public.Match.where((m) => m.sectionId.in(sectionIds)).select('id').all())
        : [];
      const rubberIds: number[] = matchIds.length
        ? ids(await tx.orm.public.Rubber.where((r) => r.matchId.in(matchIds)).select('id').all())
        : [];
      const teamRequestIds: number[] = seasonIds.length
        ? ids(await tx.orm.public.TeamRequest.where((r) => r.seasonId.in(seasonIds)).select('id').all())
        : [];

      // then delete bottom up, so no row is removed while something still points at it.
      // .in([]) is skipped since there is nothing to delete at that level
      if (rubberIds.length) {
        await tx.orm.public.RubberSet.where((r) => r.rubberId.in(rubberIds)).deleteAndCount();
        await tx.orm.public.RubberPlayer.where((r) => r.rubberId.in(rubberIds)).deleteAndCount();
        await tx.orm.public.Rubber.where((r) => r.id.in(rubberIds)).deleteAndCount();
      }
      if (matchIds.length) {
        await tx.orm.public.MatchResultEvent.where((e) => e.matchId.in(matchIds)).deleteAndCount();
        await tx.orm.public.Match.where((m) => m.id.in(matchIds)).deleteAndCount();
      }
      if (teamRequestIds.length) {
        await tx.orm.public.TeamRequestPlayer.where((p) => p.teamRequestId.in(teamRequestIds)).deleteAndCount();
        await tx.orm.public.TeamRequest.where((r) => r.id.in(teamRequestIds)).deleteAndCount();
      }
      if (teamIds.length) {
        await tx.orm.public.TeamPlayer.where((p) => p.teamId.in(teamIds)).deleteAndCount();
        await tx.orm.public.Team.where((t) => t.id.in(teamIds)).deleteAndCount();
      }
      if (sectionIds.length) {
        await tx.orm.public.Section.where((s) => s.id.in(sectionIds)).deleteAndCount();
      }
      if (seasonIds.length) {
        await tx.orm.public.Season.where((s) => s.id.in(seasonIds)).deleteAndCount();
      }

      // the formats themselves are shared, so only the links to them are removed
      await tx.orm.public.CompetitionFormat.where({ competitionId: id }).deleteAndCount();
      await tx.orm.public.Competition.where({ id }).delete();
    });
  }

}