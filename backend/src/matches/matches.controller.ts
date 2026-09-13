import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { MatchesService } from './matches.service.js';

@Controller('matches')
export class MatchesController {
    constructor(private readonly matchesService: MatchesService) {}

    @Get()
    findAll(@Query('sectionId', ParseIntPipe) sectionId: number) {
        return this.matchesService.findAll(sectionId);
    }
}
