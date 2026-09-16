import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto.js';
import { UpdateTeamDto } from './dto/update-team.dto.js';
import { db } from '../prisma/db.js';

@Injectable()
export class TeamsService {
  create(_createTeamDto: CreateTeamDto) {
    return 'This action adds a new team';
  }

  // All teams
  async findAll() {
    return await db.orm.public.Team.include('club').include('section').all();
  }

  // Team by id
  async findOne(id: number) {
    const team = await db.orm.public.Team.include('club')
      .include('section')
      .include('players', (players) => players.include('person'))
      .where({ id })
      .first();

    // 404 Team not found
    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    return team;
  }

  update(id: number, _updateTeamDto: UpdateTeamDto) {
    return `This action updates a #${id} team`;
  }

  remove(id: number) {
    return `This action removes a #${id} team`;
  }
}
