import { Body, Controller, Get, Query, ParseIntPipe, Post, Req } from '@nestjs/common';
import { MatchesService } from './matches.service.js';
import { Param } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator.js';
import { SubmitResultDto } from './dto/submit-result.dto.js';

interface AuthedRequest {
  user: { personId: string };
}

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Public()
  @Get()
  findAll(@Query('sectionId', ParseIntPipe) sectionId: number) {
    return this.matchesService.findAll(sectionId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string): Promise<any> {
    return this.matchesService.findOne(id);
  }

  @Get(':id/result-form')
  getResultForm(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.matchesService.getResultForm(id, req.user.personId);
  }

  @Post(':id/result')
  submitResult(@Param('id') id: string, @Body() dto: SubmitResultDto, @Req() req: AuthedRequest) {
    return this.matchesService.submitResult(id, dto, req.user.personId);
  }
}
