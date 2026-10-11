import { Controller, Get, Query } from '@nestjs/common';
import { FormatsService } from './formats.service.js';
import { Public } from '../auth/decorators/public.decorator.js'

@Controller('formats')
export class FormatsController {
  constructor(private readonly formatsService: FormatsService) {}

  @Public()
  @Get()
  findAll(@Query('associationId') associationId?: string) {
    return this.formatsService.findAll(associationId);
  }
}