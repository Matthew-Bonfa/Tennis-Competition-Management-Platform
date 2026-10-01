import { Controller, Get, Param, ParseEnumPipe, ParseIntPipe, Query } from '@nestjs/common';
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
  // Win/loss record, bucketed by year and discipline. year/rubberType are
  // optional pre-filters; the frontend normally fetches the full set of
  // buckets once and filters client-side instead of calling this per toggle.
  @Get(':id/record')
  findRecord(
    @Param('id') id: string,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
    @Query('rubberType', new ParseEnumPipe(RubberTypeValues, { optional: true })) rubberType?: RubberType,
  ) {
    return this.playersService.findPlayerRecord(id, year, rubberType);
  }
}
