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
    }

    return response;
  }

  async updateDetails(id: string, club: {name?: string, address?: string, contactPersonId?: string, roles?: [{personId: string, role: string}]}){
    // roles exist within PersonRole so need to be handled separately
    const {roles, ...details} = club;

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

    return await this.findOneClub(id);
  }

}

