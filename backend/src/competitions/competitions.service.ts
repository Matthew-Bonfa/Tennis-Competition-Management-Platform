import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CompetitionsService {

  constructor(private prisma: PrismaService) {} // gets database connection

  // these IDs should likley be numbers, not strings

  // find all competitions, with option to filter by association
  async findAll(associationId?: string) {
    return this.prisma.client.orm.public.Competition
      .where(associationId ? { associationId } : {}) // this is filter step, either match to association or match all
      .all();
  }

  // find one specific competition
  async findOne(id: string) {
    return this.prisma.client.orm.public.Competition
      .where({ id })
      .first();
  } 
}