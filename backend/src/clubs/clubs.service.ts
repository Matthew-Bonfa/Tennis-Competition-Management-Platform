import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ClubSummary } from './types.js';
import { toClubDetail } from './to-club-detail.js';
import { ClubDetail } from './types.js';

@Injectable()
export class ClubsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllClubs(associationId?: string) {
    let query = this.prisma.client.orm.public.Club;

    if (associationId) {
      query = query.where((club) =>
        club.associations.some((ac) => ac.associationId.eq(associationId)),
      );
    }

    return query
      .include('teams', (t) => t.count())
      .include('memberships', (m) => m.count())
      .all()
      .then((clubs) =>
        clubs.map((club) => ({
          id: club.id,
          name: club.name,
          isFinancialMember: club.isFinancialMember,
          teamCount: club.teams,
          memberCount: club.memberships,
        })),
      );
  }

  async findOneClub(id: string): Promise<ClubDetail> {
    const club = await this.prisma.client.orm.public.Club.where({ id })
      .include('contactPerson', (p) => p.select('id', 'firstName', 'lastName', 'email', 'phone'))
      .include('associations', (ac) =>
        ac.include('association', (a) => a.select('id', 'name')),
      )
      .include('teams', (t) =>
        t
          .select('id', 'name')
          .include('section', (s) => s.select('id', 'name')),
      )
      .include('memberships', (m) =>
        m
          .select('isPrimaryClub', 'isFinancialMember')
          .include('person', (p) => p.select('id', 'firstName', 'lastName')),
      )
      .include('roles', (r) =>
        r
          .select('role')
          .include('person', (p) => p.select('id', 'firstName', 'lastName')),
      )
      .first();

    if (!club) {
      throw new NotFoundException(`Club ${id} not found`);
    }

    return toClubDetail(club as any);
  }


  async createClub(club: {name: string, address?: string, contactPersonId?: string, roles: [{personId: string, role: string}]}){
    if (!club.name || club.name.trim().length === 0){
      throw new BadRequestException("Club name field is required");
    }
    const response = await this.prisma.client.orm.public.Club.create({
      name: club.name,
      address: club.address,
      contactPersonId: club.contactPersonId,
      isFinancialMember: false,
    });

    if (club.roles){
      for (let i = 0; i < club.roles.length; i++){
        await this.prisma.client.orm.public.PersonRole.create({
          clubId: response.id,
          personId: club.roles[i].personId,
          role: club.roles[i].role,
        });
      }
      // A brand-new club has no members yet, so every player named here
      // needs a membership created for them
      await this.syncPlayerMemberships(response.id, [], club.roles);
    }

    return response;
  }

  async updateDetails(id: string, club: {name?: string, address?: string, contactPersonId?: string | null, roles?: [{personId: string, role: string}]}){
    // roles exist within PersonRole so need to be handled separately
    const {roles, ...details} = club;

    // Who is currently a player here, captured before the wipe below, so we
    // can tell who was actually removed and take their membership with them
    const previousPlayers = await this.prisma.client.orm.public.PersonRole
      .where({ clubId: id, role: 'PLAYER' })
      .select('personId')
      .all();

    const updateDetails = await this.prisma.client.orm.public.Club.where({id}).update(details);
    if (!updateDetails){
      throw new NotFoundException("Club with id " + id + " not found");
    }

    // delete all the roles every time, so each update needs to specify all roles (so they can be added back afterwards)
    await this.prisma.client.orm.public.PersonRole.where({clubId: id}).deleteAll();


    if (roles){
      for (let i = 0; i < roles.length; i++){
        await this.prisma.client.orm.public.PersonRole.create({
          personId: roles[i].personId,
          role: roles[i].role,
          clubId: id
        });
      }
    }

    await this.syncPlayerMemberships(id, previousPlayers.map((p: any) => p.personId), roles);

    return await this.findOneClub(id);
  }

  // "In this club" is recorded in two tables: a PLAYER PersonRole (what the
  // club edit/profile pages manage) and a ClubMembership row (what the
  // player profile and edit-player pages show). This keeps them in step —
  // removing a player from the club deletes their membership, adding one
  // grants it. Other roles (admin etc.) never touch memberships.
  private async syncPlayerMemberships(clubId: string, previousPlayerIds: string[], roles: [{personId: string, role: string}] | undefined) {
    const currentPlayerIds = new Set(
      (roles ?? []).filter((r) => r.role === 'PLAYER').map((r) => r.personId),
    );

    for (const personId of previousPlayerIds) {
      if (currentPlayerIds.has(personId)) continue;

      const membership = await this.prisma.client.orm.public.ClubMembership
        .where((m) => m.personId.eq(personId))
        .where((m) => m.clubId.eq(clubId))
        .first();
      if (!membership) continue;

      await this.prisma.client.orm.public.ClubMembership.where({ id: membership.id }).deleteAll();

      // If the club was their primary, primary moves to one of the clubs
      // they still belong to, so they never show up without a club
      if (membership.isPrimaryClub) {
        const remaining = await this.prisma.client.orm.public.ClubMembership
          .where((m) => m.personId.eq(personId))
          .all();
        const next = remaining.find((m) => m.id !== membership.id && !m.isPrimaryClub);
        if (next) {
          await this.prisma.client.orm.public.ClubMembership.where({ id: next.id }).update({ isPrimaryClub: true });
        }
      }
    }

    for (const personId of currentPlayerIds) {
      if (previousPlayerIds.includes(personId)) continue;

      const existing = await this.prisma.client.orm.public.ClubMembership
        .where((m) => m.personId.eq(personId))
        .where((m) => m.clubId.eq(clubId))
        .first();
      if (existing) continue;

      const anyMembership = await this.prisma.client.orm.public.ClubMembership
        .where({ personId })
        .select('id')
        .first();
      await this.prisma.client.orm.public.ClubMembership.create({
        personId,
        clubId,
        isPrimaryClub: !anyMembership,
        isFinancialMember: false,
      });
    }
  }

}

