import { Controller, Get, Query } from '@nestjs/common';
import { FormatsService } from './formats.service.js';

@Controller('formats')
export class FormatsController {
  constructor(private readonly formatsService: FormatsService) {}

  @Get()
  findAll(@Query('associationId') associationId?: string) {
    return this.formatsService.findAll(associationId);
  }
}