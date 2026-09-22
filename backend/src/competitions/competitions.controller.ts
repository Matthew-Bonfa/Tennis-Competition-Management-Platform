import { Controller, Get, Param, Query } from '@nestjs/common';
import { CompetitionsService } from './competitions.service.js';

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
        return this.competitionsService.findAll(associationId)
    }

    @Get(':id')
    findOne(@Param('id') id: string){  // all params are strings -> if want nums a string use unary (+) or parseInt
        return this.competitionsService.findOne(id)
    }

}
