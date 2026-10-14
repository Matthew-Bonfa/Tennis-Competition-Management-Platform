import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { formatScoreLine } from '../rubbers/format-scoreline.js';
import { summariseRubber } from '../rubbers/summarise-rubber.js';
import { toInstant } from '../common/temporal.js';
import { computeResult } from './compute-result.js';
import type { Side, WinnerRule } from './decide-winner.js';
import type { SubmitResultDto } from './dto/submit-result.dto.js';
import { validateScoresheet } from './validate-scoresheet.js';
import type { LayoutRubber, RubberType } from './validate-scoresheet.js';

const ENTRY_STATUSES = ['scheduled', 'disputed'];

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

    private async loadMatchForResult(id: string) {
        const match = await this.prisma.client.orm.public.Match.where({ id })
            .include('section', (section) => section.include('format', (format) => format.include('rubbers')))
            .first();

        if (!match) {
            throw new NotFoundException(`Match ${id} not found`);
        }
        return match;
    }

    // Which team the person plays for in this match
    private async sideOf(personId: string, match: { homeTeamId: number; awayTeamId: number }): Promise<Side | null> {
        const membership = await this.prisma.client.orm.public.TeamPlayer
            .where((t) => t.personId.eq(personId))
            .where((t) => t.teamId.in([match.homeTeamId, match.awayTeamId]))
            .first();

        if (!membership) {
            return null;
        }
        return membership.teamId === match.homeTeamId ? 'home' : 'away';
    }

    private async rosterOf(teamId: number) {
        const players = await this.prisma.client.orm.public.TeamPlayer.where({ teamId })
            .include('person', (p) => p.select('id', 'firstName', 'lastName'))
            .all();

        return players.map((p) => ({
            personId: p.personId,
            firstName: p.person?.firstName ?? '',
            lastName: p.person?.lastName ?? '',
        }));
    }

    async getResultForm(matchId: string, personId: string) {
        const match = await this.loadMatchForResult(matchId);
        const viewerSide = await this.sideOf(personId, match);
        if (!viewerSide) {
            throw new ForbiddenException('Only players from the two teams can enter this result');
        }

        const format = match.section!.format!;
        const [homePlayers, awayPlayers] = await Promise.all([
            this.rosterOf(match.homeTeamId),
            this.rosterOf(match.awayTeamId),
        ]);

        return {
            matchId,
            matchStatus: match.matchStatus,
            viewerSide,
            format: {
                setsToWin: format.setsToWin,
                gamesPerSet: format.gamesPerSet,
                tiebreakAtGames: format.tiebreakAtGames,
                finalSetMatchTiebreak: format.finalSetMatchTiebreak,
            },
            rubbers: [...format.rubbers]
                .sort((a, b) => a.rubberNumber - b.rubberNumber)
                .map((r) => ({ rubberNumber: r.rubberNumber, rubberType: r.rubberType })),
            homeTeam: { id: match.homeTeamId, players: homePlayers },
            awayTeam: { id: match.awayTeamId, players: awayPlayers },
        };
    }

    // A player on either team submits the scoresheet. The match then waits for
    // the other team to confirm or dispute it
    async submitResult(matchId: string, dto: SubmitResultDto, personId: string) {
        const match = await this.loadMatchForResult(matchId);

        if (!ENTRY_STATUSES.includes(match.matchStatus)) {
            throw new ConflictException(`A result can't be entered while the match is ${match.matchStatus}`);
        }
        if (!(await this.sideOf(personId, match))) {
            throw new ForbiddenException('Only players from the two teams can enter this result');
        }

        const format = match.section!.format!;
        if (format.winnerDeterminedBy === 'ladder_position') {
            throw new BadRequestException('Results for this format must be entered by an admin');
        }

        const layout: LayoutRubber[] = format.rubbers.map((r) => ({
            rubberNumber: r.rubberNumber,
            rubberType: r.rubberType as RubberType,
        }));
        const [homeRoster, awayRoster] = await Promise.all([
            this.rosterOf(match.homeTeamId),
            this.rosterOf(match.awayTeamId),
        ]);

        const errors = validateScoresheet(
            format,
            layout,
            dto.rubbers,
            { home: homeRoster.map((p) => p.personId), away: awayRoster.map((p) => p.personId) },
        );
        if (errors.length > 0) {
            throw new BadRequestException({ message: 'Invalid result', errors });
        }

        const result = computeResult(
            layout,
            dto.rubbers,
            match.homeTeamId,
            match.awayTeamId,
            format.winnerDeterminedBy as WinnerRule,
        );

        await this.prisma.client.transaction(async (tx) => {
            const updated = await tx.orm.public.Match
                .where({ id: matchId, matchStatus: match.matchStatus })
                .update({
                    matchStatus: 'awaiting_confirmation',
                    enteredByPersonId: personId,
                    enteredAt: toInstant(new Date()),
                    confirmedByPersonId: null,
                    confirmedAt: null,
                    winningTeamId: result.winningTeamId,
                    disputeReason: null,
                });
            if (!updated) {
                throw new ConflictException('This match was changed by someone else. Reload and try again.');
            }

            // Re-entering after a dispute replaces the old sheet
            const oldRubbers = await tx.orm.public.Rubber.where({ matchId }).all();
            for (const old of oldRubbers) {
                await tx.orm.public.RubberSet.where({ rubberId: old.id }).delete();
                await tx.orm.public.RubberPlayer.where({ rubberId: old.id }).delete();
            }
            await tx.orm.public.Rubber.where({ matchId }).delete();

            for (const rubber of result.rubbers) {
                const created = await tx.orm.public.Rubber.create({
                    matchId,
                    rubberNumber: rubber.rubberNumber,
                    rubberType: rubber.rubberType,
                    outcomeType: rubber.outcomeType,
                    winningTeamId: rubber.winningTeamId,
                });

                for (const set of rubber.sets) {
                    await tx.orm.public.RubberSet.create({ rubberId: created.id, ...set });
                }
                for (const id of rubber.homePlayerIds) {
                    await tx.orm.public.RubberPlayer.create({ rubberId: created.id, teamId: match.homeTeamId, personId: id });
                }
                for (const id of rubber.awayPlayerIds) {
                    await tx.orm.public.RubberPlayer.create({ rubberId: created.id, teamId: match.awayTeamId, personId: id });
                }
            }

            await tx.orm.public.MatchResultEvent.create({
                matchId,
                eventType: 'entered',
                personId,
                snapshot: JSON.stringify(dto),
            });
        });

        return this.findOne(matchId);
    }
}

