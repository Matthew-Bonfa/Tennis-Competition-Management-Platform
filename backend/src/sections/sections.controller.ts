import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { SectionsService } from './sections.service.js';

@Controller('sections')
export class SectionsController {
    constructor(private readonly sectionsService: SectionsService) {}

    @Get(':id/ladder')
    getLadder(@Param('id', ParseIntPipe) id: number) {
        return this.sectionsService.calculateLadder(id);
    }
}