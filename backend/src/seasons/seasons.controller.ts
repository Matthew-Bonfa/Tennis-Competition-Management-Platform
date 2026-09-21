import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { SeasonsService } from './seasons.service.js';

@Controller('seasons')
export class SeasonsController {}

@Controller('competitions')
export class CompetitionsController {

    // injects into controller (singleton)
    constructor(private readonly seasonsService: SeasonsService) {}

    @Get(':id/sections')
    findSections(@Param('id', ParseIntPipe) id: number) {
        return this.seasonsService.findSections(id);
    }

}