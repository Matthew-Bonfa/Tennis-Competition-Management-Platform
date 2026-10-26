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
import type { ComputedResult } from './compute-result.js';
import type { Side, WinnerRule } from './decide-winner.js';
import type { AdminResultDto, DisputeResultDto, SubmitResultDto } from './dto/submit-result.dto.js';
import { validateScoresheet } from './validate-scoresheet.js';
import type { LayoutRubber, RubberType } from './validate-scoresheet.js';

const ENTRY_STATUSES = ['scheduled', 'disputed'];
const ADMIN_EDITABLE_STATUSES = ['scheduled', 'awaiting_confirmation', 'disputed', 'completed'];

type Tx = Parameters<Parameters<PrismaService['client']['transaction']>[0]>[0];

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
            .include('section', (section) => section
                .include('format', (format) => format.include('rubbers'))
                .include('season', (season) => season.include('competition', (c) => c.select('id', 'associationId'))))
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
            // Admins get the form too, with no side; anyone else is still refused
            await this.assertAssociationAdmin(personId, match, 'Only players from the two teams or an association admin can view this result form');
        }

        const format = match.section!.format!;
        const [homePlayers, awayPlayers, enteredBySide] = await Promise.all([
            this.rosterOf(match.homeTeamId),
            this.rosterOf(match.awayTeamId),
            match.enteredByPersonId ? this.sideOf(match.enteredByPersonId, match) : null,
        ]);

        return {
            matchId,
            matchStatus: match.matchStatus,
            // null means the viewer is an association admin rather than a player
            viewerSide,
            // which team entered the current result, so the client knows who can confirm it
            enteredBySide,
            disputeReason: match.disputeReason,
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

    // Validates the sheet against the format and rosters, then works out every winner
    private async scoreSheet(match: Awaited<ReturnType<MatchesService['loadMatchForResult']>>, dto: SubmitResultDto) {
        const format = match.section!.format!;
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

        return computeResult(
            layout,
            dto.rubbers,
            match.homeTeamId,
            match.awayTeamId,
            format.winnerDeterminedBy as WinnerRule,
        );
    }

    // Replaces whatever sheet the match had with the computed one
    private async saveRubbers(
        tx: Tx,
        match: { id: string; homeTeamId: number; awayTeamId: number },
        result: ComputedResult,
    ) {
        const matchId = match.id;
        const oldRubbers = await tx.orm.public.Rubber.where({ matchId }).all();
        for (const old of oldRubbers) {
            await tx.orm.public.RubberSet.where({ rubberId: old.id }).deleteAndCount();
            await tx.orm.public.RubberPlayer.where({ rubberId: old.id }).deleteAndCount();
        }
        await tx.orm.public.Rubber.where({ matchId }).deleteAndCount();

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

        const result = await this.scoreSheet(match, dto);

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

            await this.saveRubbers(tx, match, result);

            await tx.orm.public.MatchResultEvent.create({
                matchId,
                eventType: 'entered',
                personId,
                snapshot: JSON.stringify(dto),
            });
        });

        return this.findOne(matchId);
    }

    // Confirming or disputing must come from a player on the other team to whoever entered it
    private async assertOpposingPlayer(
        match: { matchStatus: string; enteredByPersonId: string | null; homeTeamId: number; awayTeamId: number },
        personId: string,
    ) {
        if (match.matchStatus !== 'awaiting_confirmation') {
            throw new ConflictException(`There is no result to confirm while the match is ${match.matchStatus}`);
        }
        const [viewerSide, entererSide] = await Promise.all([
            this.sideOf(personId, match),
            this.sideOf(match.enteredByPersonId!, match),
        ]);
        if (!viewerSide) {
            throw new ForbiddenException('Only players from the two teams can confirm this result');
        }
        if (viewerSide === entererSide) {
            throw new ForbiddenException('The result must be confirmed by a player from the other team');
        }
    }

    // The other team accepts the result, which makes it count towards the ladder
    async confirmResult(matchId: string, personId: string) {
        const match = await this.loadMatchForResult(matchId);
        await this.assertOpposingPlayer(match, personId);

        await this.prisma.client.transaction(async (tx) => {
            const updated = await tx.orm.public.Match
                .where({ id: matchId, matchStatus: 'awaiting_confirmation' })
                .update({
                    matchStatus: 'completed',
                    confirmedByPersonId: personId,
                    confirmedAt: toInstant(new Date()),
                });
            if (!updated) {
                throw new ConflictException('This match was changed by someone else. Reload and try again.');
            }
            await tx.orm.public.MatchResultEvent.create({ matchId, eventType: 'confirmed', personId });
        });

        return this.findOne(matchId);
    }

    // The other team rejects the result; either team can then re-enter it
    async disputeResult(matchId: string, dto: DisputeResultDto, personId: string) {
        const match = await this.loadMatchForResult(matchId);
        await this.assertOpposingPlayer(match, personId);

        await this.prisma.client.transaction(async (tx) => {
            const updated = await tx.orm.public.Match
                .where({ id: matchId, matchStatus: 'awaiting_confirmation' })
                .update({ matchStatus: 'disputed', disputeReason: dto.reason });
            if (!updated) {
                throw new ConflictException('This match was changed by someone else. Reload and try again.');
            }
            await tx.orm.public.MatchResultEvent.create({ matchId, eventType: 'disputed', personId, note: dto.reason });
        });

        return this.findOne(matchId);
    }

    // The JWT only says someone is an association admin, not of which association
    private async assertAssociationAdmin(
        personId: string,
        match: Awaited<ReturnType<MatchesService['loadMatchForResult']>>,
        message = 'Only an admin of this association can change this result',
    ) {
        const associationId = match.section!.season!.competition!.associationId;
        const role = await this.prisma.client.orm.public.PersonRole
            .where({ personId, role: 'ASSOCIATION_ADMIN', associationId })
            .first();
        if (!role) {
            throw new ForbiddenException(message);
        }
    }

    // An admin enters or corrects a result directly. It skips confirmation and is logged as an override
    async adminSetResult(matchId: string, dto: AdminResultDto, personId: string) {
        const match = await this.loadMatchForResult(matchId);
        await this.assertAssociationAdmin(personId, match);

        if (!ADMIN_EDITABLE_STATUSES.includes(match.matchStatus)) {
            throw new ConflictException(`A result can't be set while the match is ${match.matchStatus}`);
        }
        if (match.section!.format!.winnerDeterminedBy === 'ladder_position') {
            throw new BadRequestException("Results for ladder position formats can't be entered from a scoresheet yet");
        }

        const result = await this.scoreSheet(match, dto);
        const now = toInstant(new Date());

        await this.prisma.client.transaction(async (tx) => {
            const updated = await tx.orm.public.Match
                .where({ id: matchId, matchStatus: match.matchStatus })
                .update({
                    matchStatus: 'completed',
                    enteredByPersonId: personId,
                    enteredAt: now,
                    confirmedByPersonId: personId,
                    confirmedAt: now,
                    winningTeamId: result.winningTeamId,
                    disputeReason: null,
                });
            if (!updated) {
                throw new ConflictException('This match was changed by someone else. Reload and try again.');
            }

            await this.saveRubbers(tx, match, result);

            await tx.orm.public.MatchResultEvent.create({
                matchId,
                eventType: 'overridden',
                personId,
                note: dto.note ?? null,
                snapshot: JSON.stringify(dto),
            });
        });

        return this.findOne(matchId);
    }
}
