import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AssociationsService } from '../associations/associations.service.js'
import { SeasonsService } from '../seasons/seasons.service.js';

@Injectable()
export class CompetitionsService {

  constructor(
    private prisma: PrismaService,
    private readonly associationsService: AssociationsService,
    private readonly seasonsService: SeasonsService
  ) {}
  
  // FOR COMPETITIONS PAGE
  // get all competitions for specified association (or all competitions)
  async findAll(associationId?: string) {
    const competitions = await this.prisma.client.orm.public.Competition
      .where(associationId ? { associationId } : {})
      .all();

    // get every association to look up names
    const associations = await this.associationsService.findAll()

    // return association and competition -> relevant details
    return competitions.map((competition) => {
      // find association that matches foreign key in competition
      const association = associations.find((a) => a.id === competition.associationId);
      return {
        id: competition.id,
        name: competition.name,
        association: association ? { id: association.id, name: association.name } : null, // limit to specific fields of association
      };
    });
  }

  // FOR COMPETITION (SINGULAR) PAGE  
  // find one specific competition, with its association and its seasons
  async findOne(id: string) {
    const competition = await this.prisma.client.orm.public.Competition
      .where({ id })
      .first(); // means single competition object is returned, not list with one element

    // if nothing was found, send back a proper "404 not found" error
    if (!competition) {
      throw new NotFoundException(`Competition ${id} not found`);
    }

    // look up the association this competition belongs to
    const association = await this.associationsService.findOne(competition.associationId)

    // get every season that belongs to this competition
    const seasons = await this.seasonsService.findAll(id)

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