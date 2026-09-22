import { Controller, DefaultValuePipe, Get, ParseEnumPipe, ParseIntPipe, Query } from '@nestjs/common'
import { FixturesService } from './fixtures.service.js'
import { FixtureStatusFilter } from './types.js'
import type { Fixture } from './types.js'

@Controller('fixtures')
export class FixturesController {
    constructor(private readonly fixturesService: FixturesService) {}

    @Get()
    findAll(
        @Query('teamId', new ParseIntPipe({ optional: true })) teamId: number | undefined,
        @Query('sectionId', new ParseIntPipe({ optional: true })) sectionId: number | undefined,
        @Query('status', new DefaultValuePipe(FixtureStatusFilter.all), new ParseEnumPipe(FixtureStatusFilter)) status: FixtureStatusFilter,
    ): Promise<Fixture[]> {
        return this.fixturesService.findAll({ teamId, sectionId, status });
    }
}
