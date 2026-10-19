import { Controller, Get, Param, Query, Post, Body, Patch, Delete, HttpCode, ParseUUIDPipe } from '@nestjs/common';
import { CompetitionsService } from './competitions.service.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CreateCompetitionDto } from './dto/create-competition.dto.js';
import { UpdateCompetitionDto } from './dto/update-competition.dto.js';

@Controller('competitions')
export class CompetitionsController {
  
    // injects into controller (singleton)
    constructor(private readonly competitionsService: CompetitionsService) {}
 
 
    // returns a lists of all competitions, can filter by association
    @Public()
    @Get()
    findAll(@Query('associationId') associationId?: string) {
        return this.competitionsService.findAll(associationId);
    }

    // returns one competition by its ID
    @Public()
    @Get(':id')
    findOne(@Param('id') id: string){  // all params are strings -> if want nums a string use unary (+) or parseInt
        return this.competitionsService.findOne(id);
    }

    // create a new competition
    @Roles('ASSOCIATION_ADMIN')
    @Post()
    create(@Body() createCompetitionDto: CreateCompetitionDto){
        return this.competitionsService.create(createCompetitionDto)
    } 

    // updates a competition
    @Roles('ASSOCIATION_ADMIN')
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateCompetitionDto: UpdateCompetitionDto,
    ) {
        // NEED WAY TO STORE HISTORICAL CHANGES
        return this.competitionsService.update(id, updateCompetitionDto);
    }
 
    // deletes a competition and everything under it (seasons, sections, teams, matches)
    @Roles('ASSOCIATION_ADMIN')
    @Delete(':id')
    @HttpCode(204)
    delete(@Param('id', ParseUUIDPipe) id: string){
        return this.competitionsService.remove(id);
    }
}
