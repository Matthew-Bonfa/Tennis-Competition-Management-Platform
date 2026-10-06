import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { SeasonsService } from './seasons.service.js';
import { CreateSeasonDto } from './dto/create-season.dto.js';

@Controller('seasons')
export class SeasonsController {

    constructor(private readonly seasonsService: SeasonsService) {}

    @Get()
    findAll(@Query('competitionId') competitionId?: string){
        return this.seasonsService.findAll(competitionId)
    }
    
    @Get(':id')
    findOne(id: number){
        return this.seasonsService.findOne(id);
    }

    @Post()
    create(@Body() createSeasonDto: CreateSeasonDto) {
        return this.seasonsService.create(createSeasonDto);
    }

}




