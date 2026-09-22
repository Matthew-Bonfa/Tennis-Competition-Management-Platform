import { Controller, Get, Param } from '@nestjs/common';
import { AssociationsService } from './associations.service.js';

@Controller('associations')
export class AssociationsController {

    // injects into controller (singleton)
    constructor(private readonly associationsService: AssociationsService) {}

    // returns a lists of all associations rows
    @Get()
    findAll(){
        return this. associationsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string){
        return this. associationsService.findOne(id)
    }

}
