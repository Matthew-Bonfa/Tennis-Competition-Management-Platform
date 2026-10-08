import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotFoundException } from '@nestjs/common';
import { formatScoreLine } from '../rubbers/format-scoreline.js';
import { summariseRubber } from '../rubbers/summarise-rubber.js';

// A null location means the match is played at the home team's club.
function withEffectiveLocation<
    M extends { location: string | null; homeTeam: { club: { id: string; name: string } | null } | null },
>(match: M) {
    return {
        ...match,
        location: match.location ?? match.homeTeam?.club?.name ?? null,
        locationClubId: match.location === null ? (match.homeTeam?.club?.id ?? null) : null,
    };
}

@Injectable()
export class MatchesService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(sectionId: number) {
        return this.prisma.client.orm.public.Match
        .where({ sectionId })
        .include('homeTeam', (team) => team.select('id', 'name').include('club', (club) => club.select('id', 'name')))
        .include('awayTeam', (team) => team.select('id', 'name'))
        .all()
        .then((matches) => matches.map(withEffectiveLocation));
    }

    async findOne(id: string): Promise<any> {
        const match = await this.prisma.client.orm.public.Match.where({ id })
            .include('homeTeam', (team) => team.select('id', 'name').include('club', (club) => club.select('id', 'name')))
            .include('awayTeam', (team) => team.select('id', 'name'))
            .include('rubbers', (rubber) => rubber
                .orderBy((r) => r.rubberNumber.asc())
                .include('sets', (set) => set.orderBy((s) => s.setNumber.asc()))
                .include('players', (player) => player.select('personId', 'teamId').include('person', (p) => p.select('firstName', 'lastName')))
            )
            .first();

        if (!match) {
            throw new NotFoundException(`Match ${id} not found`);
        }

        const rubbersWithSummary = match.rubbers.map((rubber) => ({
            ...rubber,
            scoreline: formatScoreLine(rubber.sets),
            summary: summariseRubber(rubber.sets),
        }));

        return { ...withEffectiveLocation(match), rubbers: rubbersWithSummary };
    }
}

