import { Module } from '@nestjs/common';
import { FormatsController } from './formats.controller.js';
import { FormatsService } from './formats.service.js';

@Module({
  controllers: [FormatsController],
  providers: [FormatsService]
})
export class FormatsModule {}
