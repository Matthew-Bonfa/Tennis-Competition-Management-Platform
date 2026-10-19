import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ClubsService } from './clubs.service.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

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


  // creating a club only needs a name - immediately call updateDetails if you want to give other fields
  @Roles("ASSOCIATION_ADMIN", "CLUB_ADMIN")
  @Post()
  createClub(@Body() club: {name: string, address?: string, contactPersonId?: string, roles: [{personId: string, role: string}]}){
        return this.clubsService.createClub(club);
  }

  @Roles("ASSOCIATION_ADMIN", "CLUB_ADMIN")
  @Patch(':id')
  updateDetails(@Param('id') id: string, @Body() club: {name?: string, address?: string, contactPersonId?: string, roles?: [{personId: string, role: string}]}) {
    return this.clubsService.updateDetails(id, club);
  }

}

