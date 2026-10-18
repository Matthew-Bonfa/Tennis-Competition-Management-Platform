import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { summariseRubber } from '../rubbers/summarise-rubber.js';
import { NotFoundException } from '@nestjs/common';
import { rankLadderRows } from './rank-ladder.js';
import type { LadderAccumulator } from './rank-ladder.js';
import type { LadderRow } from './types.js';
import { groupIntoRounds } from './group-rounds.js';
import type { RoundSummary } from './types.js';
import { CreateSectionDto } from './dto/create-section.dto.js';
import { UpdateSectionDto } from './dto/update-section.dto.js';

@Injectable()
export class SectionsService {
  constructor(private readonly prisma: PrismaService) {}

  // get all sections for a season
  async findAll(seasonId: number) {
    const sections = await this.prisma.client.orm.public.Section.where({
      seasonId,
    }).all();

    return sections.map((section) => ({
      id: section.id,
      name: section.name,
    }));
  }

  // NEED TO ADD GETTING ONE SECTION DETAILS
  async findOne(id: number) {
    const section = await this.prisma.client.orm.public.Section.where({
      id,
    }).first();

    // if nothing was found, send back a proper "404 not found" error
    if (!section) {
      throw new NotFoundException(`Section ${id} not found`);
    }

    const ladder = await this.calculateLadder(id);

    // NEED TO ADD FIXTURE HERE ONCE ZACH COMPLETES

    return {
      id: section.id,
      name: section.name,
      seasonId: section.seasonId,
      formatId: section.formatId,
      gradeLabel: section.gradeLabel,
      ladder: ladder,
    };
  }

  async retrieveCompletedMatches(sectionId: number): Promise<any> {
    return this.prisma.client.orm.public.Match.where({
      sectionId,
      matchStatus: 'completed',
    })
      .include('homeTeam', (team) => team.select('id', 'name'))
      .include('awayTeam', (team) => team.select('id', 'name'))
      .include('rubbers', (rubber) =>
        rubber
          .orderBy((r) => r.rubberNumber.asc())
          .include('sets', (set) => set.orderBy((s) => s.setNumber.asc()))
          .include('players', (player) => player.select('personId', 'teamId')),
      )
      .all();
  }

  async calculateLadder(sectionId: number): Promise<LadderRow[]> {
    const section = await this.prisma.client.orm.public.Section.where({
      id: sectionId,
    })
      .include('format', (format) =>
        format.select('pointsPerMatchWin', 'pointsPerRubber'),
      )
      .first();
    if (!section) {
      throw new NotFoundException(`Section ${sectionId} not found`);
    }

    const teams = await this.prisma.client.orm.public.Team.where({ sectionId })
      .select('id', 'name')
      .all();

    const matches = await this.retrieveCompletedMatches(sectionId);
    const ladder = new Map<number, LadderAccumulator>();

    for (const team of teams) {
      ladder.set(team.id, {
        teamId: team.id,
        teamName: team.name,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesDrawn: 0,
        matchesLost: 0,
        rubbersWon: 0,
        rubbersLost: 0,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0,
        points: 0,
      });
    }

    for (const match of matches) {
      const homeTeam = match.homeTeam;
      const awayTeam = match.awayTeam;
      const homeStats = ladder.get(homeTeam.id)!;
      const awayStats = ladder.get(awayTeam.id)!;

      homeStats.matchesPlayed++;
      awayStats.matchesPlayed++;

      let homeRubbersWon = 0;
      let awayRubbersWon = 0;

      for (const rubber of match.rubbers) {
        const rubberSummary = summariseRubber(rubber.sets);
        const homeGames = rubberSummary.homeGamesWon;
        const awayGames = rubberSummary.awayGamesWon;

        if (rubber.winningTeamId === homeTeam.id) {
          homeRubbersWon++;
        } else if (rubber.winningTeamId === awayTeam.id) {
          awayRubbersWon++;
        }

        homeStats.setsWon += rubber.sets.filter(
          (set: any) => set.homeGames > set.awayGames,
        ).length;
        homeStats.setsLost += rubber.sets.filter(
          (set: any) => set.homeGames < set.awayGames,
        ).length;
        homeStats.gamesWon += homeGames;
        homeStats.gamesLost += awayGames;

        awayStats.setsWon += rubber.sets.filter(
          (set: any) => set.awayGames > set.homeGames,
        ).length;
        awayStats.setsLost += rubber.sets.filter(
          (set: any) => set.awayGames < set.homeGames,
        ).length;
        awayStats.gamesWon += awayGames;
        awayStats.gamesLost += homeGames;
      }

      // checks whether section format has been populated
      if (!section.format) {
        throw new NotFoundException(`Format ${section.formatId} not found`);
      }

      if (homeRubbersWon > awayRubbersWon) {
        homeStats.matchesWon++;
        awayStats.matchesLost++;
        homeStats.points += section.format.pointsPerMatchWin;
      } else if (awayRubbersWon > homeRubbersWon) {
        awayStats.matchesWon++;
        homeStats.matchesLost++;
        awayStats.points += section.format.pointsPerMatchWin;
      } else {
        homeStats.matchesDrawn++;
        awayStats.matchesDrawn++;
        homeStats.points += section.format.pointsPerMatchWin / 2;
        awayStats.points += section.format.pointsPerMatchWin / 2;
      }

      homeStats.points += homeRubbersWon * section.format.pointsPerRubber;
      awayStats.points += awayRubbersWon * section.format.pointsPerRubber;

      homeStats.rubbersWon += homeRubbersWon;
      homeStats.rubbersLost += awayRubbersWon;
      awayStats.rubbersWon += awayRubbersWon;
      awayStats.rubbersLost += homeRubbersWon;
    }

    return rankLadderRows(Array.from(ladder.values()));
  }

  async getRounds(sectionId: number): Promise<RoundSummary[]> {
    const section = await this.prisma.client.orm.public.Section.where({
      id: sectionId,
    }).first();
    if (!section) {
      throw new NotFoundException(`Section ${sectionId} not found`);
    }

    const matches = await this.prisma.client.orm.public.Match.where({
      sectionId,
    })
      .select('roundNumber', 'matchDate', 'matchStatus')
      .all();

    return groupIntoRounds(matches);
  }

  // create a section
  async create(createSectionDto: CreateSectionDto) {
    return this.prisma.client.orm.public.Section.create({
      name: createSectionDto.name,
      seasonId: createSectionDto.seasonId,
      formatId: createSectionDto.formatId,
      gradeLabel: createSectionDto.gradeLabel ?? null,
    });
  }

  // everything the section owns goes with it, its fixtures and
  // every rubber, set, player row and result event hanging off those fixtures,
  // and the teams that were entered into it with their rosters. Nothing here
  // is soft-deleted or archived, so the row is gone for good.
  //
  // Teams are the one thing that isn't only inside a section, but a team
  // belongs to exactly one and the column is NOT NULL, so it can't outlive its
  // section by being left behind. A TeamRequest is different: it records what a
  // club asked for, so it survives the team it produced with the link cleared.
  async remove(id: number) {
    return this.prisma.client.transaction(async (tx) => {
      const section = await tx.orm.public.Section.where({ id }).first();

      // Checked inside the transaction so two deletes racing can't both report success
      if (!section) {
        throw new NotFoundException(`Section ${id} not found`);
      }

      // Deepest rows first
      const matches = await tx.orm.public.Match.where({ sectionId: id })
        .select('id')
        .all();
      const matchIds = matches.map((match) => match.id);

      const rubbers = matchIds.length
        ? await tx.orm.public.Rubber.where((rubber) =>
            rubber.matchId.in(matchIds),
          )
            .select('id')
            .all()
        : [];
      const rubberIds = rubbers.map((rubber) => rubber.id);

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
        // The audit trail hangs off the match, not off the rubber, so it has to
        // go before the match it describes
        await tx.orm.public.MatchResultEvent.where((event) =>
          event.matchId.in(matchIds),
        ).deleteAndCount();
        await tx.orm.public.Match.where((match) =>
          match.id.in(matchIds),
        ).deleteAndCount();
      }

      const teams = await tx.orm.public.Team.where({ sectionId: id })
        .select('id')
        .all();
      const teamIds = teams.map((team) => team.id);

      if (teamIds.length) {
        await tx.orm.public.TeamPlayer.where((player) =>
          player.teamId.in(teamIds),
        ).deleteAndCount();
        await tx.orm.public.TeamRequest.where((request) =>
          request.teamId.in(teamIds),
        ).updateAll({ teamId: null });
        await tx.orm.public.Team.where((team) =>
          team.id.in(teamIds),
        ).deleteAndCount();
      }

      await tx.orm.public.Section.where({ id }).delete();

      return {
        id,
        name: section.name,
        matchesDeleted: matchIds.length,
        rubbersDeleted: rubberIds.length,
        teamsDeleted: teamIds.length,
      };
    });
  }

  async update(id: number, updateSectionDto: UpdateSectionDto) {
    // quick existence check (since findOne also calculates the ladder, which we don't need here)
    const existing = await this.prisma.client.orm.public.Section.where({
      id,
    }).first();
    if (!existing) {
      throw new NotFoundException(`Section ${id} not found`);
    }

    const data: any = {};
    if (updateSectionDto.name !== undefined) {
      data.name = updateSectionDto.name;
    }
    if (updateSectionDto.gradeLabel !== undefined) {
      data.gradeLabel = updateSectionDto.gradeLabel;
    }

    if (updateSectionDto.formatId !== undefined) {
      // check the format exists, otherwise the database throws a
      // confusing foreign key error (a 500) instead of a clear 404
      const format = await this.prisma.client.orm.public.Format.where({
        id: updateSectionDto.formatId,
      }).first();
      if (!format) {
        throw new NotFoundException(
          `Format ${updateSectionDto.formatId} not found`,
        );
      }
      data.formatId = updateSectionDto.formatId;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Nothing to update');
    }

    return this.prisma.client.orm.public.Section.where({ id }).update(data);
  }
}

