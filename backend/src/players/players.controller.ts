import { Body, Controller, Get, Param, ParseEnumPipe, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { UpdatePlayerDto } from './dto/update-player.dto.js';
import { PlayersService } from './players.service.js';
import { RubberTypeValues } from './types.js';
import type { RubberType } from './types.js';

@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  // GET /players?search=&clubId=
  // Player search list. Both query params are optional.
  @Get()
  findAll(@Query('search') search?: string, @Query('clubId') clubId?: string) {
    return this.playersService.findAllPlayers(search, clubId);
  }

  // GET /players/:id
  // Full profile: identity, clubs, and the competitions/teams they play in.
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.playersService.findOnePlayer(id);
  }

  // GET /players/:id/record?year=&rubberType=
  // Win/loss record, bucketed by year and discipline
  @Get(':id/record')
  findRecord(
    @Param('id') id: string,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
    @Query('rubberType', new ParseEnumPipe(RubberTypeValues, { optional: true })) rubberType?: RubberType,
  ) {
    return this.playersService.findPlayerRecord(id, year, rubberType);
  }

  // PATCH /players/:id
  // Partial edit of a player's identity fields (name, date of birth, UTR
  // id, Tennis Australia number, email, phone). Returns the updated
  // profile in the same shape as GET /players/:id.
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePlayerDto: UpdatePlayerDto) {
    return this.playersService.updatePlayer(id, updatePlayerDto);
  }
}
