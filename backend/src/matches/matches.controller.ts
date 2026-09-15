import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { MatchesService } from './matches.service.js';
import { Param, NotFoundException } from '@nestjs/common';

@Controller('matches')
export class MatchesController {
    constructor(private readonly matchesService: MatchesService) {}

    @Get()
    findAll(@Query('sectionId', ParseIntPipe) sectionId: number) {
        return this.matchesService.findAll(sectionId);
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<any> {
        return this.matchesService.findOne(id);
    }
}
