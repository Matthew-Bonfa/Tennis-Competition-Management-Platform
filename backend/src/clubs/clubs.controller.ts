import { Controller, Get, Param, Query } from '@nestjs/common';
import { ClubsService } from './clubs.service.js';

@Controller('clubs')
export class ClubsController {
    constructor(private readonly clubsService: ClubsService) {}

    @Get()
    findAll(@Query('associationId') associationId?: string) {
        return this.clubsService.findAllClubs(associationId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.clubsService.findOneClub(id);
    }
}