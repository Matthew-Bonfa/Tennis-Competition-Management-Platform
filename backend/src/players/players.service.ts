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
  async updatePlayer(id: string, dto: UpdatePlayerDto, user: RequestUser): Promise<PlayerDetail> {
    // Memberships are not a Person column — they're upserted into
    // ClubMembership below, so keep them out of the identity update.
    const { memberships, ...personFields } = dto;

    // A save can legitimately change only memberships (e.g. ticking the
    // financial flag): an empty identity diff means no Person UPDATE at
    // all — findOnePlayer at the end still 404s unknown players.
    if (Object.keys(personFields).length > 0) {
      const data = toPersonUpdate(personFields);
      const updated = await this.prisma.client.orm.public.Person.where({ id }).select('id').update(data);
      if (!updated) {
        throw new NotFoundException(`Player ${id} not found`);
      }
    }

    // Memberships are kept in step with the list the form sends: each club
    // in the list is upserted, and a membership at a club the list no longer
    // names is deleted. Every touched club (added or removed) goes behind
    // the same club-admin check the rest of the service uses, so a club
    // admin can never touch a club they don't run.
    if (memberships) {
      const listedClubIds = new Set<string>();
      for (const membership of memberships) {
        const club = await this.prisma.client.orm.public.Club
          .where({ id: membership.clubId })
          .select('id')
          .first();
        if (!club) {
          throw new NotFoundException(`Club ${membership.clubId} not found`);
        }
        await this.assertCanManageClub(user, membership.clubId);
        listedClubIds.add(membership.clubId);

        const existing = await this.prisma.client.orm.public.ClubMembership
          .where((row) => row.personId.eq(id))
          .where((row) => row.clubId.eq(membership.clubId))
          .first();

        if (existing) {
          if (existing.isFinancialMember !== membership.isFinancialMember) {
            await this.prisma.client.orm.public.ClubMembership
              .where({ id: existing.id })
              .update({ isFinancialMember: membership.isFinancialMember });
          }
          // Also heals memberships that predate the role sync
          await this.ensurePlayerRole(id, membership.clubId);
        } else {
          // A first-ever membership becomes the primary club, so the player
          // always shows up under a club
          const anyMembership = await this.prisma.client.orm.public.ClubMembership
            .where({ personId: id })
            .select('id')
            .first();
          await this.prisma.client.orm.public.ClubMembership.create({
            personId: id,
            clubId: membership.clubId,
            isPrimaryClub: !anyMembership,
            isFinancialMember: membership.isFinancialMember,
          });

          // Joining a club as a member makes them a player there too, so
          // the club pages see them as well
          await this.ensurePlayerRole(id, membership.clubId);
        }
      }

      // Removals: clubs the list no longer names. A club admin silently
      // skips clubs they don't run rather than failing the whole save.
      const current = await this.prisma.client.orm.public.ClubMembership
        .where((row) => row.personId.eq(id))
        .all();
      for (const membership of current) {
        if (listedClubIds.has(membership.clubId)) continue;
        try {
          await this.assertCanManageClub(user, membership.clubId);
        } catch {
          continue;
        }

        await this.prisma.client.orm.public.ClubMembership
          .where({ id: membership.id })
          .deleteAll();

        // Leaving a club also ends their player role there, so the club
        // pages stop listing them too
        await this.prisma.client.orm.public.PersonRole
          .where((role) => role.personId.eq(id))
          .where((role) => role.role.eq('PLAYER'))
          .where((role) => role.clubId.eq(membership.clubId))
          .deleteAll();

        // If the removed club was their primary, primary moves to one of
        // the clubs they still belong to
        if (membership.isPrimaryClub) {
          const remaining = await this.prisma.client.orm.public.ClubMembership
            .where((row) => row.personId.eq(id))
            .all();
          const next = remaining.find((row) => row.id !== membership.id && !row.isPrimaryClub);
          if (next) {
            await this.prisma.client.orm.public.ClubMembership
              .where({ id: next.id })
              .update({ isPrimaryClub: true });
          }
        }
      }
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

      // Membership implies the player role, so the club pages list them too
      await tx.orm.public.PersonRole.create({
        personId: person.id,
        role: 'PLAYER',
        clubId: dto.clubId,
      });

      return person;
    });

    // read it back after the transaction has committed
    return this.findOnePlayer(created.id);
  }

  // Club membership and the PLAYER role are two views of the same fact, so
  // a membership created here grants the role too (if they don't have it).
  private async ensurePlayerRole(personId: string, clubId: string) {
    const existing = await this.prisma.client.orm.public.PersonRole
      .where((role) => role.personId.eq(personId))
      .where((role) => role.role.eq('PLAYER'))
      .where((role) => role.clubId.eq(clubId))
      .first();
    if (!existing) {
      await this.prisma.client.orm.public.PersonRole.create({
        personId,
        role: 'PLAYER',
        clubId,
      });
    }
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
