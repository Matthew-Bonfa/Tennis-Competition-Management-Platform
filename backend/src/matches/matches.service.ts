import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class MatchesService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(sectionId: number) {
        return this.prisma.client.orm.public.Match
        .where({ sectionId })
        .include('homeTeam', (team) => team.select('id', 'name'))
        .include('awayTeam', (team) => team.select('id', 'name'))
        .all();
    }
}

