import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { CreatePlayerDto } from './dto/create-player.dto.js';
import { UpdatePlayerDto } from './dto/update-player.dto.js';
import { PlayersService } from './players.service.js';
import type { RequestUser } from './players.service.js';
import { RubberTypeValues } from './types.js';
import type { RubberType } from './types.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  // GET /players?search=&clubId=
  // Player search list. Both query params are optional.
  @Roles('ASSOCIATION_ADMIN', 'CLUB_ADMIN')
  @Get()
  findAll(@Query('search') search?: string, @Query('clubId') clubId?: string) {
    return this.playersService.findAllPlayers(search, clubId);
  }

  // POST /players
  // Creates a player and their primary club membership. A club admin can
  // only add players to their own club. Returns the profile in the same
  // shape as GET /players/:id.
  @Roles('ASSOCIATION_ADMIN', 'CLUB_ADMIN')
  @Post()
  create(@Body() createPlayerDto: CreatePlayerDto, @Req() req: { user: RequestUser }) {
    return this.playersService.createPlayer(createPlayerDto, req.user);
  }

  // GET /players/:id
  // Full profile: identity, clubs, and the competitions/teams they play in.
  @Roles('ASSOCIATION_ADMIN', 'CLUB_ADMIN')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.playersService.findOnePlayer(id);
  }

  // GET /players/:id/record?year=&rubberType=
  // Win/loss record, bucketed by year and discipline
  @Roles('ASSOCIATION_ADMIN', 'CLUB_ADMIN')
  @Get(':id/record')
  findRecord(
    @Param('id') id: string,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
    @Query(
      'rubberType',
      new ParseEnumPipe(RubberTypeValues, { optional: true }),
    )
    rubberType?: RubberType,
  ) {
    return this.playersService.findPlayerRecord(id, year, rubberType);
  }

  // PATCH /players/:id
  // Partial edit of a player's identity fields (name, date of birth, UTR
  // id, Tennis Australia number, email, phone). Returns the updated
  // profile in the same shape as GET /players/:id.
  @Roles('ASSOCIATION_ADMIN', 'CLUB_ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePlayerDto: UpdatePlayerDto) {
    return this.playersService.updatePlayer(id, updatePlayerDto);
  }
}
