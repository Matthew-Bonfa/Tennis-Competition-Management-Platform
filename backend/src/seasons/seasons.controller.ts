import { Controller, Get, Query, Post, Body, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { SeasonsService } from './seasons.service.js';
import { CreateSeasonDto } from './dto/create-season.dto.js';
import { UpdateSeasonDto } from './dto/update-season.dto.js';

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

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateSeasonDto: UpdateSeasonDto,
    ) {
        return this.seasonsService.update(id, updateSeasonDto);
    }

}




