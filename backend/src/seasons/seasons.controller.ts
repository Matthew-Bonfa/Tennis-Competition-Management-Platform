import { Controller, Get, Query } from '@nestjs/common';
import { SeasonsService } from './seasons.service.js';
import { Public } from '../auth/decorators/public.decorator.js';

@Controller('seasons')
export class SeasonsController {
  constructor(private readonly seasonsService: SeasonsService) {}

  @Public()
  @Get()
  findAll(@Query('competitionId') competitionId?: string) {
    return this.seasonsService.findAll(competitionId);
  }

  @Public()
  @Get(':id')
  findOne(id: number) {
    return this.seasonsService.findOne(id);
  }
}
