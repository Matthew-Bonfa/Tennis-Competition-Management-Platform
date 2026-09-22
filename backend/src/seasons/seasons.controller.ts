import { Controller, Get, Query } from '@nestjs/common';
import { SeasonsService } from './seasons.service.js';

@Controller('seasons')
export class SeasonsController {

    constructor(private readonly seasonsService: SeasonsService) {}

    @Get()
    findAll(@Query('competitionId') competitionId?: string){
        return this.seasonsService.findAll(competitionId)
    }
    
}




