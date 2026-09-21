import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CompetitionsService {

  constructor(private prisma: PrismaService) {} // gets database connection

    // find all competitions, with option to filter by association
  async findAll(associationId?: string) {
    const competitions = await this.prisma.client.orm.public.Competition
      .where(associationId ? { associationId } : {})
      .all();

    // get every association so we can look up names
    const associations = await this.prisma.client.orm.public.Association
      .where({})
      .all();

    // build the response: each competition plus its association's id and name
    return competitions.map((competition) => {
      const association = associations.find((a) => a.id === competition.associationId);
      return {
        id: competition.id,
        name: competition.name,
        association: association ? { id: association.id, name: association.name } : null,
      };
    });
  }

    // find one specific competition, with its association and its seasons
  async findOne(id: string) {
    const competition = await this.prisma.client.orm.public.Competition
      .where({ id })
      .first();

    // if nothing was found, send back a proper "404 not found" error
    if (!competition) {
      throw new NotFoundException(`Competition ${id} not found`);
    }

    // look up the association this competition belongs to
    const association = await this.prisma.client.orm.public.Association
      .where({ id: competition.associationId })
      .first();

    // get every season that belongs to this competition
    const seasons = await this.prisma.client.orm.public.Season
      .where({ competitionId: id })
      .all();

    return {
      id: competition.id,
      name: competition.name,
      association: association ? { id: association.id, name: association.name } : null,
      seasons: seasons.map((season) => ({
        id: season.id,
        name: season.name,
        startDate: season.startDate,
        endDate: season.endDate,
      })),
    };
  }
}