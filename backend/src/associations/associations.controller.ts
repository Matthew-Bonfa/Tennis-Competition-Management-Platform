import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';

import { AssociationsService } from './associations.service.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('associations')
export class AssociationsController {
  constructor(private associationsService: AssociationsService) {}

  @Public()
  @Get()
  async getAllAssociations() {
    const response = await this.associationsService.getAll();
    return response;
  }

  @Public()
  @Get('/:id')
  getAssociation(@Param('id') id: string) {
    return this.associationsService.getAssociation(id);
  }

  @Roles('ASSOCIATION_ADMIN')
  @Post()
  async insertAssociation(@Body() body: { name: string, contactPersonId?: string, roles?: [{personId: string, role: string}] }) {
    const newAssociation =
      await this.associationsService.insertAssociation(body);
    return newAssociation;
  }

  @Roles('ASSOCIATION_ADMIN')
  @Put(':id')
  async updateAssociation(@Param('id') id: string, @Body() body: {name: string, contactPersonId?: string | null, roles?: [{personId: string, role: string}]}){
    const updatedAssociation = await this.associationsService.updateAssociation(id, body);
    return updatedAssociation;
  }

}
