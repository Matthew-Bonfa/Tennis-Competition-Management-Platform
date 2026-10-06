import { Controller, Get, Param, Query, Post, Body, Patch, Delete } from '@nestjs/common';
import { CompetitionsService } from './competitions.service.js';
import { CreateCompetitionDto } from './dto/create-competition.dto.js';
import { UpdateCompetitionDto } from './dto/update-competition.dto.js';
    /* 
    describes the routes (functions ?) undertaken for competitions
        get all users
        get user by id
        create new user
        edit a user
        delete a user
    */

@Controller('competitions')
export class CompetitionsController {

    // injects into controller (singleton)
    constructor(private readonly competitionsService: CompetitionsService) {}

    // returns a lists of all competitions, can filter by association
    @Get()
    findAll(@Query('associationId') associationId?: string){
        return this.competitionsService.findAll(associationId);
    }

    // returns one competition by its ID
    @Get(':id')
    findOne(@Param('id') id: string){  // all params are strings -> if want nums a string use unary (+) or parseInt
        return this.competitionsService.findOne(id);
    }

    // create a new competition
    @Post()
    create(@Body() createCompetitionDto: CreateCompetitionDto){
        return this.competitionsService.create(createCompetitionDto)
    } 

    // updates a competition
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateCompetitionDto: UpdateCompetitionDto,
    ) {
        // NEED WAY TO STORE HISTORICAL CHANGES
        return this.competitionsService.update(id, updateCompetitionDto);
    }
 
    // deletes a competition
    @Delete('id')
    delete(@Param('id') id: string){
        // NEED WAY TO STORE HISTORICAL COMPETITONS
        return { id }
    }

}
