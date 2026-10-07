import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';

import { AssociationsService } from './associations.service.js';

@Controller('associations')
export class AssociationsController {
  constructor(private associationsService: AssociationsService) {}

  @Get()
  async getAllAssociations() {
    const response = await this.associationsService.getAll();
    console.log(response);
    return response;
  }

  @Get('/:id')
  getAssociation(@Param('id') id: string) {
    return this.associationsService.getAssociation(id);
  }

  @Post()
  async insertAssociation(@Body() body: {name: string}){
    const newAssociation = await this.associationsService.insertAssociation(body);
    return newAssociation;
  }
  
  @Put(':id')
  async updateAssociation(@Param('id') id: string, @Body() body: {name: string}){
  const updatedAssociation = await this.associationsService.updateAssociation(id, body);
  return updatedAssociation;
}



}
