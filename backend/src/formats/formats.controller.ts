import { Controller, Get, Post, Param, ParseUUIDPipe, Body } from '@nestjs/common';
import { FormatsService } from './formats.service.js';
import { Public } from '../auth/decorators/public.decorator.js'
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CreateFormatDto } from './dto/create-format.dto.js';

@Controller('formats')
export class FormatsController {
  constructor(private readonly formatsService: FormatsService) {}

  // list of formats (id and name), for dropdowns
  @Public()
  @Get()
  findAll() {
    return this.formatsService.findAll();
  }

  // one format with its rubbers and permitted genders
  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.formatsService.findOne(id);
  }

  // create a new format (formats are never edited, only created)
  @Roles('ASSOCIATION_ADMIN')
  @Post()
  create(@Body() createFormatDto: CreateFormatDto) {
    return this.formatsService.create(createFormatDto);
  }
}