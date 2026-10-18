import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSeasonDto } from './dto/create-season.dto.js';
import { UpdateSeasonDto } from './dto/update-season.dto.js';
import 'temporal-polyfill/full/global';

const Temporal = (globalThis as any).Temporal;

@Injectable()
export class SeasonsService {
  constructor(private prisma: PrismaService) {}

  async findAll(competitionId?: string) {
    const seasons = await this.prisma.client.orm.public.Season.where(
      competitionId ? { competitionId } : {},
    ).all();
    return seasons;
  }

  // not for specifc page, just to have (?)
  async findOne(id: number) {
    const season = await this.prisma.client.orm.public.Season.where({
      id,
    }).first();

    if (!season) {
      throw new NotFoundException(`Season ${id} not found`);
    }

    return season;
  }

  async create(createSeasonDto: CreateSeasonDto) {
    return this.prisma.client.orm.public.Season.create({
      name: createSeasonDto.name,
      competitionId: createSeasonDto.competitionId,
      startDate: Temporal.Instant.from(
        new Date(createSeasonDto.startDate).toISOString(),
      ),
      endDate: Temporal.Instant.from(
        new Date(createSeasonDto.endDate).toISOString(),
      ),
    });
  }

  async update(id: number, updateSeasonDto: UpdateSeasonDto) {
    // throws a 404 if the season doesn't exist
    await this.findOne(id);

    const data: any = {};
    if (updateSeasonDto.name != null) {
      data.name = updateSeasonDto.name;
    }
    if (updateSeasonDto.startDate != null) {
      data.startDate = Temporal.Instant.from(
        new Date(updateSeasonDto.startDate).toISOString(),
      );
    }
    if (updateSeasonDto.endDate != null) {
      data.endDate = Temporal.Instant.from(
        new Date(updateSeasonDto.endDate).toISOString(),
      );
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Nothing to update');
    }

    return this.prisma.client.orm.public.Season.where({ id }).update(data);
  }

  // Hard delete -> sections, every fixture, rubber, set, player row and result
  // event, plus the teams entered into those sections.
  //
  // Unlike Format, this is not blocked when the season is in use. A format is
  // referenced from above and shared between sections, so deleting one would
  // strand its referrers; a season's sections live strictly inside it and
  // Section.seasonId is NOT NULL
  async remove(id: number) {
    return this.prisma.client.transaction(async (tx) => {
      const season = await tx.orm.public.Season.where({ id }).first();

      if (!season) {
        throw new NotFoundException(`Season ${id} not found`);
      }

      // A registration request belongs to the season it asked to enter and
      // its seasonId is NOT NULL.
      // Its players are deleted first, since TeamRequestPlayer points back at it.
      const requests = await tx.orm.public.TeamRequest.where({
        seasonId: id,
      })
        .select('id')
        .all();
      const requestIds = requests.map((request) => request.id);

      if (requestIds.length) {
        await tx.orm.public.TeamRequestPlayer.where((player) =>
          player.teamRequestId.in(requestIds),
        ).deleteAndCount();
        await tx.orm.public.TeamRequest.where((request) =>
          request.id.in(requestIds),
        ).deleteAndCount();
      }

      const sections = await tx.orm.public.Section.where({ seasonId: id })
        .select('id')
        .all();
      const sectionIds = sections.map((section) => section.id);

      let matchesDeleted = 0;
      let rubbersDeleted = 0;
      let teamsDeleted = 0;

      if (sectionIds.length) {
        // Deepest rows first
        const matches = await tx.orm.public.Match.where((match) =>
          match.sectionId.in(sectionIds),
        )
          .select('id')
          .all();
        const matchIds = matches.map((match) => match.id);
        matchesDeleted = matchIds.length;

        const rubbers = matchIds.length
          ? await tx.orm.public.Rubber.where((rubber) =>
              rubber.matchId.in(matchIds),
            )
              .select('id')
              .all()
          : [];
        const rubberIds = rubbers.map((rubber) => rubber.id);
        rubbersDeleted = rubberIds.length;

        if (rubberIds.length) {
          await tx.orm.public.RubberSet.where((set) =>
            set.rubberId.in(rubberIds),
          ).deleteAndCount();
          await tx.orm.public.RubberPlayer.where((player) =>
            player.rubberId.in(rubberIds),
          ).deleteAndCount();
          await tx.orm.public.Rubber.where((rubber) =>
            rubber.id.in(rubberIds),
          ).deleteAndCount();
        }

        if (matchIds.length) {
          // The audit trail hangs off the match, not off the rubber, so
          // it has to go before the match it describes.
          await tx.orm.public.MatchResultEvent.where((event) =>
            event.matchId.in(matchIds),
          ).deleteAndCount();
          await tx.orm.public.Match.where((match) =>
            match.id.in(matchIds),
          ).deleteAndCount();
        }

        const teams = await tx.orm.public.Team.where((team) =>
          team.sectionId.in(sectionIds),
        )
          .select('id')
          .all();
        const teamIds = teams.map((team) => team.id);
        teamsDeleted = teamIds.length;

        if (teamIds.length) {
          await tx.orm.public.TeamPlayer.where((player) =>
            player.teamId.in(teamIds),
          ).deleteAndCount();
          // This season's own requests are already gone, so anything
          // still pointing at these teams belongs to another season.
          // Unlinked rather than left to break the foreign key.
          await tx.orm.public.TeamRequest.where((request) =>
            request.teamId.in(teamIds),
          ).updateAll({ teamId: null });
          await tx.orm.public.Team.where((team) =>
            team.id.in(teamIds),
          ).deleteAndCount();
        }

        await tx.orm.public.Section.where((section) =>
          section.id.in(sectionIds),
        ).deleteAndCount();
      }

      await tx.orm.public.Season.where({ id }).delete();

      return {
        id,
        name: season.name,
        sectionsDeleted: sectionIds.length,
        matchesDeleted,
        rubbersDeleted,
        teamsDeleted,
        teamRequestsDeleted: requestIds.length,
      };
    });
  }
}
