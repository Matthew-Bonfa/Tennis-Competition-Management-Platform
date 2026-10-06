import { Controller, Get, Post, Param, Body } from '@nestjs/common';

import { AssociationsService } from './associations.service.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('associations')
export class AssociationsController {
  constructor(private associationsService: AssociationsService) {}

  @Public()
  @Get()
  getAllAssociations() {
    return this.associationsService.getAll();
  }

  @Public()
  @Get('/:id')
  getAssociation(@Param('id') id: string) {
    return this.associationsService.getAssociation(id);
  }

  @Roles('ASSOCIATION_ADMIN')
  @Post()
  async insertAssociation(@Body() body: { name: string; contactId?: string }) {
    const newAssociation =
      await this.associationsService.insertAssociation(body);
    return newAssociation;
  }
}
