import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotFoundException } from '@nestjs/common';
import { ClubSummary } from './types.js';
import { toClubDetail } from './to-club-detail.js';
import { ClubDetail } from './types.js';

@Injectable()
export class ClubsService {
    constructor(private readonly prisma: PrismaService) {}

    async findAllClubs() : Promise<ClubSummary[]> {
        return this.prisma.client.orm.public.Club
            .include('teams', (t) => t.count())
            .include('memberships', (m) => m.count())
            .all()
            .then(clubs => clubs.map(club => ({
                id: club.id,
                name: club.name,
                isFinancialMember: club.isFinancialMember,
                teamCount: club.teams,
                memberCount: club.memberships,
            })));
    }

    async findOneClub(id: string): Promise<ClubDetail> {
        const club = await this.prisma.client.orm.public.Club.where({ id })
            .include('contactPerson', (p) => p.select('id', 'firstName', 'lastName'))
            .include('associations', (ac) => ac.include('association', (a) => a.select('id', 'name')))
            .include('teams', (t) => t.select('id', 'name').include('section', (s) => s.select('id', 'name')))
            .include('memberships', (m) => m.select('isPrimaryClub', 'isFinancialMember').include('person', (p) => p.select('id', 'firstName', 'lastName')))
            .include('roles', (r) => r.select('role').include('person', (p) => p.select('id', 'firstName', 'lastName')))
            .first();

        if (!club) {
            throw new NotFoundException(`Club ${id} not found`);
        }

        return toClubDetail(club);

    }
}