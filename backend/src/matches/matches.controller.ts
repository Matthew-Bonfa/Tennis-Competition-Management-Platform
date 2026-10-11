import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { MatchesService } from './matches.service.js';
import { Param } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator.js';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Public()
  @Get()
  findAll(@Query('sectionId', ParseIntPipe) sectionId: number) {
    return this.matchesService.findAll(sectionId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string): Promise<any> {
    return this.matchesService.findOne(id);
  }
}
