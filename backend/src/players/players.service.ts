import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { or } from '@prisma/orm-postgres/orm-client';
import { fromInstant, toInstant } from '../common/temporal.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreatePlayerDto } from './dto/create-player.dto.js';
import type { UpdatePlayerDto } from './dto/update-player.dto.js';
import { nextPersonCode } from './next-person-code.js';
import { summarisePlayerRecord } from './summarise-player-record.js';
import type { PlayerRubberRow } from './summarise-player-record.js';
import { toPersonUpdate } from './to-person-update.js';
import { toPlayerDetail } from './to-player-detail.js';
import { toPlayerSummary } from './to-player-summary.js';
import type { PlayerDetail, PlayerRecord, PlayerSummary, RubberType } from './types.js';

// The signed-in user, as JwtStrategy attaches it to the request
export interface RequestUser {
  personId: string;
  roles: string[];
}

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  // FOR THE PLAYERS SEARCH PAGE
  // `search` matches first name, last name or player code (case-insensitive
  // substring); `clubId` narrows to players with a membership at that club.
  // Both are optional and compose. Capped at 50 results, alphabetical by
  // name — this is a search-as-you-type list, not a full export.
  async findAllPlayers(search?: string, clubId?: string): Promise<PlayerSummary[]> {
    let players = this.prisma.client.orm.public.Person;

    if (search) {
      const pattern = `%${search}%`;
      players = players.where((p) =>
        or(p.firstName.ilike(pattern), p.lastName.ilike(pattern), p.personCode.ilike(pattern)),
      );
    }

    if (clubId) {
      players = players.where((p) => p.clubMemberships.some((m) => m.clubId.eq(clubId)));
    }

    const rows = await players
      .select('id', 'personCode', 'firstName', 'lastName')
      .include('clubMemberships', (m) =>
        m.select('isPrimaryClub').include('club', (c) => c.select('name')),
      )
      .orderBy([(p) => p.lastName.asc(), (p) => p.firstName.asc()])
      .limit(50)
      .all();

    return rows.map((row) => toPlayerSummary(row as any));
  }

  // FOR THE PLAYER PROFILE PAGE — "current information" side
  // Identity, every club membership, and every team (with the full
  // competition chain above it) the player currently belongs to. Win/loss
  // stats are a separate call (findPlayerRecord) so loading the profile
  // doesn't also pay for walking the player's entire rubber history.
  async findOnePlayer(id: string): Promise<PlayerDetail> {
    const person = await this.prisma.client.orm.public.Person.where({ id })
      .include('clubMemberships', (m) =>
        m
          .select('isPrimaryClub', 'isFinancialMember')
          .include('club', (c) => c.select('id', 'name')),
      )
      .include('teamMemberships', (tm) =>
        tm.include('team', (t) =>
          t
            .select('id', 'name')
            .include('club', (c) => c.select('id', 'name'))
            .include('section', (s) =>
              s
                .select('id', 'name')
                .include('season', (se) =>
                  se
                    .select('id', 'name')
                    .include('competition', (co) =>
                      co
                        .select('id', 'name')
                        .include('association', (a) => a.select('id', 'name')),
                    ),
                ),
            ),
        ),
      )
      .first();

    if (!person) {
      throw new NotFoundException(`Player ${id} not found`);
    }

    return toPlayerDetail(person as any);
  }

  // FOR THE PLAYER PROFILE PAGE — "stats" side
  // Returns every (year, rubberType) bucket the player has a result in.
  // `year`/`rubberType` narrow which buckets come back, but the frontend
  // actually filters the full bucket list client-side (instant toggling,
  // no refetch) — these params exist so the endpoint is independently
  // useful on its own, e.g. a future "export this year's record" link.
  async findPlayerRecord(id: string, year?: number, rubberType?: RubberType): Promise<PlayerRecord> {
    const person = await this.prisma.client.orm.public.Person.where({ id }).select('id').first();
    if (!person) {
      throw new NotFoundException(`Player ${id} not found`);
    }

    // Walk from RubberPlayer (one row per rubber this person played in)
    // rather than from Person, since RubberPlayer.teamId is exactly "which
    // side was this player on", needed to tell a win from a loss and to
    // orient the home/away set and game counts onto the player's side.
    const participations = await this.prisma.client.orm.public.RubberPlayer.where({ personId: id })
      .select('teamId')
      .include('rubber', (r) =>
        r
          .select('winningTeamId', 'rubberType')
          .include('sets', (s) => s.orderBy((set) => set.setNumber.asc()))
          .include('match', (m) => m.select('matchDate', 'homeTeamId')),
      )
      .all();

    const rows: PlayerRubberRow[] = participations.map((p: any) => ({
      // Calendar year of the match, in UTC so the bucket a result lands in
      // doesn't shift with the server's local timezone.
      year: fromInstant(p.rubber.match.matchDate).getUTCFullYear(),
      rubberType: p.rubber.rubberType,
      playerTeamId: p.teamId,
      winningTeamId: p.rubber.winningTeamId,
      isHomeSide: p.teamId === p.rubber.match.homeTeamId,
      sets: p.rubber.sets,
    }));

    const allBuckets = summarisePlayerRecord(rows);

    // Derived from the *unfiltered* buckets, so narrowing below never
    // shrinks the filter dropdowns themselves — a player viewing "2023"
    // should still see every year (and discipline) they're able to pick.
    const years = [...new Set(allBuckets.map((b) => b.year))].sort((a, b) => b - a);
    const rubberTypes = [...new Set(allBuckets.map((b) => b.rubberType))];

    let buckets = allBuckets;
    if (year !== undefined) {
      buckets = buckets.filter((b) => b.year === year);
    }
    if (rubberType !== undefined) {
      buckets = buckets.filter((b) => b.rubberType === rubberType);
    }

    return { buckets, years, rubberTypes };
  }

  // edit form
  async updatePlayer(id: string, dto: UpdatePlayerDto): Promise<PlayerDetail> {
    const data = toPersonUpdate(dto);

    const updated = await this.prisma.client.orm.public.Person.where({ id }).select('id').update(data);

    if (!updated) {
      throw new NotFoundException(`Player ${id} not found`);
    }

    return this.findOnePlayer(id);
  }

  // FOR THE ADD PLAYER FORM
  // Creates the person and their primary club membership together, so a
  // new player always shows up under their club. Returns the profile in
  // the same shape as GET /players/:id.
  async createPlayer(dto: CreatePlayerDto, user: RequestUser): Promise<PlayerDetail> {
    const club = await this.prisma.client.orm.public.Club.where({ id: dto.clubId }).select('id').first();
    if (!club) {
      throw new NotFoundException(`Club ${dto.clubId} not found`);
    }

    await this.assertCanManageClub(user, dto.clubId);

    // A Tennis Australia number identifies exactly one person, so a second
    // player with the same one is a duplicate. Email is not checked: juniors
    // are often registered under a parent's address.
    if (dto.tennisAustraliaNumber) {
      const existing = await this.prisma.client.orm.public.Person.where({
        tennisAustraliaNumber: dto.tennisAustraliaNumber,
      })
        .select('id')
        .first();
      if (existing) {
        throw new ConflictException(
          `A player with Tennis Australia number ${dto.tennisAustraliaNumber} already exists`,
        );
      }
    }

    const codes = await this.prisma.client.orm.public.Person.select('personCode').all();
    const personCode = nextPersonCode(codes.map((p: any) => p.personCode));

    // one transaction: a person is never left without their club membership
    const created = await this.prisma.client.transaction(async (tx) => {
      const person = await tx.orm.public.Person.create({
        personCode,
        firstName: dto.firstName,
        lastName: dto.lastName,
        dateOfBirth: dto.dateOfBirth ? toInstant(new Date(dto.dateOfBirth)) : null,
        utrId: dto.utrId ?? null,
        tennisAustraliaNumber: dto.tennisAustraliaNumber ?? null,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
      });

      await tx.orm.public.ClubMembership.create({
        personId: person.id,
        clubId: dto.clubId,
        isPrimaryClub: true,
        isFinancialMember: dto.isFinancialMember ?? false,
      });

      return person;
    });

    // read it back after the transaction has committed
    return this.findOnePlayer(created.id);
  }

  // The JWT only says someone is a club admin, not of which club. An
  // association admin can add players to any club; a club admin only to
  // the club their CLUB_ADMIN role is attached to.
  private async assertCanManageClub(user: RequestUser, clubId: string) {
    if (user.roles.includes('ASSOCIATION_ADMIN')) {
      return;
    }

    const role = await this.prisma.client.orm.public.PersonRole.where({
      personId: user.personId,
      role: 'CLUB_ADMIN',
      clubId,
    }).first();
    if (!role) {
      throw new ForbiddenException('Only an admin of this club can add players to it');
    }
  }
}
