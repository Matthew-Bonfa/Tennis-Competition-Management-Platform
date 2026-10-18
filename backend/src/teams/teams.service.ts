import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SectionsService } from '../sections/sections.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTeamDto } from './dto/create-team.dto.js';
import { UpdateTeamDto } from './dto/update-team.dto.js';
import { toTeamDetail } from './to-team-detail.js';
import type { TeamDetail, TeamRecord } from './types.js';

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sectionsService: SectionsService,
  ) {}

  async create(data: {clubId: string, sectionId: number, name: string, players: [{personId: string}]}) {
    if (!data.players){
      throw new BadRequestException("No players given");
    }
    
    return this.prisma.client.orm.public.Team.create({
      clubId: data.clubId,
      sectionId: data.sectionId,
      name: data.name,
      players: (tp) =>
        tp.create(data.players.map(player => ({
          personId: player.personId
        })))
    });
  }

  async getOneRequest(id: number){
    return await this.prisma.client.orm.public.TeamRequest
      .where({id})
      .include("players")
      .first();
  }

  async getRequestsBySeason(id: number){
    return await this.prisma.client.orm.public.TeamRequest
      .where({seasonId: id})
      .include("players")
      .all();
  }

  async register(data: {clubId: string, seasonId: number, sectionComment: string, formatId: string, name: string, players: [{personId: string}]}){
    if (!data.players){
      throw new BadRequestException("No players given");
    }
    return await this.prisma.client.orm.public.TeamRequest.create({
      clubId: data.clubId,
      seasonId: data.seasonId,
      sectionComment: data.sectionComment,
      formatId: data.formatId,
      name: data.name,
      pending: true,
      players: (trp) =>
        trp.create(data.players.map(player => ({
          personId: player.personId
        })))
    });
  }

  async approve(id: number, sectionId: number){
    const request = await this.getOneRequest(id);
    if (!request){
      throw new NotFoundException("No request with id " + id);
    }
    if (!request.pending){
      throw new BadRequestException('Already handled request ' + request.id);
    }
    
    // make the team
    let newTeamWithoutPlayers = {
      clubId: request.clubId,
      sectionId: sectionId,
      name: request.name,
    };

    let newTeam: any;
    if (request.players.length > 0){
      newTeam = {
        ...newTeamWithoutPlayers,
        players: request.players.map(player => ({
          personId: player.personId
        }))
      };
    } else {
      newTeam = {...newTeamWithoutPlayers};
    }

    const response = await this.create(newTeam);

    // modify the request
    const updateResponse = await this.prisma.client.orm.public.TeamRequest
      .where({id: id})
      .update({teamId: response.id, pending: false});
    
    return response;
  }

  async deny(id: number){
    const request = await this.getOneRequest(id);
    if (!request){
      throw new NotFoundException("No request with id " + id);
    }
    if (!request.pending){
      throw new BadRequestException('Already handled request ' + request.id);
    }
    const response = await this.prisma.client.orm.public.TeamRequest
      .where({id: id})
      .update({pending: false});

    return response;
  }

  // All teams
  async findAll() {
    return await this.prisma.client.orm.public.Team.include('club')
      .include('section')
      .include('players')
      .all();
  }

  // FOR THE TEAM PROFILE PAGE — identity and roster
  // The win/loss record is a separate call (findTeamRecord) because it
  // walks every completed match in the team's section; loading the roster
  // shouldn't have to pay for that.
  async findOneTeam(id: number): Promise<TeamDetail> {
    const team = await this.prisma.client.orm.public.Team.where({ id })
      .select('id', 'name', 'teamGender')
      .include('club', (club) => club.select('id', 'name'))
      .include('section', (section) =>
        section
          .select('id', 'name')
          .include('season', (season) =>
            season
              .select('id', 'name')
              .include('competition', (competition) =>
                competition
                  .select('id', 'name')
                  .include('association', (association) => association.select('id', 'name')),
              ),
          ),
      )
      .include('players', (players) =>
        players.include('person', (person) => person.select('id', 'firstName', 'lastName')),
      )
      .first();

    // 404 Team not found
    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    const detail = toTeamDetail(team as any);

    // Sorted here rather than in the query: the order wanted is by the
    // *person's* surname, one relation below the roster rows themselves.
    return {
      ...detail,
      players: [...detail.players].sort(
        (a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName),
      ),
    };
  }

  // FOR THE TEAM PROFILE PAGE — win/loss record
  // Lifted straight out of the section ladder rather than re-tallying the
  // team's matches here, so the record on this page and the team's row on
  // the ladder can never disagree about the same season.
  async findTeamRecord(id: number): Promise<TeamRecord> {
    const team = await this.prisma.client.orm.public.Team.where({ id })
      .select('id')
      .include('section', (section) => section.select('id', 'name'))
      .first();

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }
    if (!team.section){
      throw new NotFoundException(`Team's section not found`);
    }

    const ladder = await this.sectionsService.calculateLadder(team.section.id);
    const row = ladder.find((ladderRow) => ladderRow.teamId === id);

    // calculateLadder seeds a row for every team in the section, so a
    // missing row means the team moved sections mid-request — not a team
    // that simply hasn't played yet, which still gets a zeroed row.
    if (!row) {
      throw new NotFoundException(`Team with ID ${id} not found in section ${team.section.id}`);
    }

    return {
      ...row,
      sectionId: team.section.id,
      sectionName: team.section.name,
      winPercentage: winRate(row.matchesWon, row.matchesPlayed),
    };
  }

  update(id: number, _updateTeamDto: UpdateTeamDto) {
    return `This action updates a #${id} team`;
  }

  remove(id: number) {
    return `This action removes a #${id} team`;
  }
}

// compute win percentage
function winRate(won: number, played: number): number {
  return played === 0 ? 0 : Math.round((won / played) * 1000) / 10;
}
