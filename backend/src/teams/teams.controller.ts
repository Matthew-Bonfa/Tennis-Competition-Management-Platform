import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { TeamsService } from './teams.service.js';
import { CreateTeamDto } from './dto/create-team.dto.js';
import { UpdateTeamDto } from './dto/update-team.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}




  // POST /teams
  @Roles('ASSOCIATION_ADMIN', 'CLUB_ADMIN')
  @Post()
  create(@Body() data: {clubId: string, sectionId: number, name: string, players: [{personId: string}]}) {
    return this.teamsService.create(data);
  }

  // POST /teams/register
  @Roles('ASSOCIATION_ADMIN', 'CLUB_ADMIN')
  @Post('register')
  register(@Body () data: {clubId: string, seasonId: number, sectionComment: string, formatId: string, name: string, teamGender: "open" | "boys" | "girls" | null | undefined, players: [{personId: string}]}){
    return this.teamsService.register(data);
  }

  // GET /teams/requests/:id
  @Roles('ASSOCIATION_ADMIN')
  @Get('requests/:id')
  getOneRequest(@Param('id', ParseIntPipe) id: number){
    return this.teamsService.getOneRequest(id);
  }

  // GET /teams/requests/seasons/:id
  @Roles('ASSOCIATION_ADMIN')
  @Get('requests/seasons/:id')
  getRequestsBySeason(@Param('id', ParseIntPipe) id: number){
    return this.teamsService.getRequestsBySeason(id);
  }


  // PATCH /teams/approve/:id
  @Roles('ASSOCIATION_ADMIN')
  @Patch('approve/:id')
  approve(@Param('id', ParseIntPipe) id: number, @Body() data: {sectionId: number}){
    return this.teamsService.approve(id, data.sectionId);
  }

  // PATCH /teams/deny/:id
  @Roles('ASSOCIATION_ADMIN')
  @Patch('deny/:id')
  deny(@Param('id', ParseIntPipe) id: number){
    return this.teamsService.deny(id);
  }

  // GET /teams
  @Public()
  @Get()
  findAll() {
    return this.teamsService.findAll();
  }

  // GET /teams/:id/record
  @Public()
  @Get(':id/record')
  findRecord(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.findTeamRecord(id);
  }

  // GET /teams/:id
  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.findOneTeam(id);
  }

  @Roles('ASSOCIATION_ADMIN', 'CLUB_ADMIN')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTeamDto: UpdateTeamDto) {
    return this.teamsService.update(id, updateTeamDto);
  }

  @Roles('ASSOCIATION_ADMIN', 'CLUB_ADMIN')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.remove(id);
  }
}
