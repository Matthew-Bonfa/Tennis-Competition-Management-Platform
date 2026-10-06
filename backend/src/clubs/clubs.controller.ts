import { Controller, Get, Param, Query } from '@nestjs/common';
import { ClubsService } from './clubs.service.js';
import { Public } from '../auth/decorators/public.decorator.js';

@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Public()
  @Get()
  findAll(@Query('associationId') associationId?: string) {
    return this.clubsService.findAllClubs(associationId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clubsService.findOneClub(id);
  }
}

