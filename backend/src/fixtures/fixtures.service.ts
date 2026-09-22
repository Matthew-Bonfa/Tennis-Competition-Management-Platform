import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { or } from '@prisma/orm-postgres/orm-client'
import { PrismaService } from '../prisma/prisma.service.js'
import { toFixture } from './to-fixture.js'
import type { Fixture, FixtureQuery } from './types.js'

@Injectable()
export class FixturesService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll({ teamId, sectionId, status }: FixtureQuery): Promise<Fixture[]> {
        if (teamId === undefined && sectionId === undefined) {
            throw new BadRequestException('Need to provide teamId, sectionId, or both');
        }

        let matches = this.prisma.client.orm.public.Match;

        if (teamId !== undefined) {
            const team = await this.prisma.client.orm.public.Team.where({ id: teamId }).first();

            if (!team) {
                throw new NotFoundException(`Team with ID ${teamId} not found`);
            }

            matches = matches.where((m) => or(m.homeTeamId.eq(teamId), m.awayTeamId.eq(teamId)));
        }

        if (sectionId !== undefined) {
            const section = await this.prisma.client.orm.public.Section.where({ id: sectionId }).first();

            if (!section) {
                throw new NotFoundException(`Section with ID ${sectionId} not found`);
            }

            matches = matches.where({ sectionId });
        }

        if (status === 'upcoming') {
            matches = matches.where({ matchStatus: 'scheduled' });
        } else if (status === 'results') {
            matches = matches.where((m) => m.matchStatus.neq('scheduled'));
        }

        const rows = await matches
            .orderBy([(m) => m.matchDate.asc(), (m) => m.roundNumber.asc()])
            .include('homeTeam', (t) => t.select('id', 'name').include('club', (c) => c.select('id', 'name')))
            .include('awayTeam', (t) => t.select('id', 'name').include('club', (c) => c.select('id', 'name')))
            .include('rubbers', (r) => r.select('winningTeamId'))
            .all();

        return rows.map(toFixture);
    }
}
