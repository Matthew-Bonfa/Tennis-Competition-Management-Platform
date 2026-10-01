import { Controller, Get, Post, Param, Body } from '@nestjs/common';

import { AssociationsService } from './associations.service.js';

@Controller('associations')
export class AssociationsController {
  constructor(private associationsService: AssociationsService) {}

  @Get()
  getAllAssociations() {
    return this.associationsService.getAll();
  }

  @Get('/:id')
  getAssociation(@Param('id') id: string) {
    return this.associationsService.getAssociation(id);
  }

  @Post()
  async insertAssociation(@Body() body: {name: string, contactId?: string}){
    const newAssociation = await this.associationsService.insertAssociation(body);
    return newAssociation;
  }
  
  



}
