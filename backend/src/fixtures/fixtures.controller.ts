import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseEnumPipe,
  ParseIntPipe,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { csvFilename } from '../common/csv-filename.js';
import { toCsv } from '../common/csv.js';
import { FixturesService } from './fixtures.service.js';
import { FIXTURE_CSV_COLUMNS, toFixtureCsvRow } from './to-fixture-csv-row.js';
import { FixtureStatusFilter } from './types.js';
import type { Fixture } from './types.js';
import { Public } from '../auth/decorators/public.decorator.js';

@Controller('fixtures')
export class FixturesController {
  constructor(private readonly fixturesService: FixturesService) {}

  @Public()
  @Get()
  findAll(
    @Query('teamId', new ParseIntPipe({ optional: true }))
    teamId: number | undefined,
    @Query('sectionId', new ParseIntPipe({ optional: true }))
    sectionId: number | undefined,
    @Query(
      'status',
      new DefaultValuePipe(FixtureStatusFilter.all),
      new ParseEnumPipe(FixtureStatusFilter),
    )
    status: FixtureStatusFilter,
    @Query('round', new ParseIntPipe({ optional: true }))
    round: number | undefined,
  ): Promise<Fixture[]> {
    return this.fixturesService.findAll({ teamId, sectionId, status, round });
  }

  // A static path segment ('export') must be declared before any :id-style
  // route on this controller, or Nest will try to parse it as one.
  @Public()
  @Get('export')
  async exportCsv(
    @Query('teamId', new ParseIntPipe({ optional: true }))
    teamId: number | undefined,
    @Query('sectionId', new ParseIntPipe({ optional: true }))
    sectionId: number | undefined,
    @Query(
      'status',
      new DefaultValuePipe(FixtureStatusFilter.all),
      new ParseEnumPipe(FixtureStatusFilter),
    )
    status: FixtureStatusFilter,
    @Query('round', new ParseIntPipe({ optional: true }))
    round: number | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    const fixtures = await this.fixturesService.findAll({
      teamId,
      sectionId,
      status,
      round,
    });
    const filename = csvFilename([
      'fixtures',
      teamId && `team-${teamId}`,
      sectionId && `section-${sectionId}`,
      status,
    ]);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Leading BOM so Excel opens the file as UTF-8 instead of guessing
    // the system codepage and mangling non-ASCII team/club names.
    return '﻿' + toCsv(fixtures.map(toFixtureCsvRow), FIXTURE_CSV_COLUMNS);
  }
}
