import { Controller, Get, Param, ParseIntPipe, Res } from '@nestjs/common';
import type { Response } from 'express';
import { csvFilename } from '../common/csv-filename.js';
import { toCsv } from '../common/csv.js';
import { SectionsService } from './sections.service.js';
import { LADDER_CSV_COLUMNS, toLadderCsvRow } from './to-ladder-csv-row.js';

@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  // Declared above ':id/ladder' as a matter of habit: it shares the
  // '/ladder' prefix rather than colliding on it, but the export/static
  // route stays ahead of any parameterised sibling to avoid surprises.
  @Get(':id/ladder/export')
  async exportLadderCsv(@Param('id', ParseIntPipe) id: number, @Res({ passthrough: true }) res: Response): Promise<string> {
    const ladder = await this.sectionsService.calculateLadder(id);
    const filename = csvFilename(['ladder', 'section', id]);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Leading BOM so Excel opens the file as UTF-8 instead of guessing the
    // system codepage and mangling non-ASCII team names.
    return '﻿' + toCsv(ladder.map(toLadderCsvRow), LADDER_CSV_COLUMNS);
  }

  @Get(':id/ladder')
  getLadder(@Param('id', ParseIntPipe) id: number) {
    return this.sectionsService.calculateLadder(id);
  }

  @Get(':id/rounds')
  getRounds(@Param('id', ParseIntPipe) id: number) {
    return this.sectionsService.getRounds(id);
  }
}
