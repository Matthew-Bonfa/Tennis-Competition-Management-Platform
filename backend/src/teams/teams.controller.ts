import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { TeamsService } from './teams.service.js';
import { CreateTeamDto } from './dto/create-team.dto.js';
import { UpdateTeamDto } from './dto/update-team.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Roles('ASSOCIATION_ADMIN', 'CLUB_ADMIN')
  @Post()
  create(@Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.create(createTeamDto);
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
