import { Module } from '@nestjs/common';
import AssociationsController from './associations.controller.js';
import AssociationsService from './associations.service.js';

@Module({
  controllers: [AssociationsController],
  providers: [AssociationsService]
})
export class AssociationsModule {}
