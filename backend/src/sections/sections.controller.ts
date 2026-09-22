import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { SectionsService } from './sections.service.js';

@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Get(':id/ladder')
  getLadder(@Param('id', ParseIntPipe) id: number) {
    return this.sectionsService.calculateLadder(id);
  }

  //get all sections based on season ID
  @Get()
  findAll(@Query('seasonId') seasonId: number){
    return this.sectionsService.findAll(seasonId);
  }

  @Get(':id')
    findOne(id: number){
        return this.sectionsService.findOne(id);
    }
}

