import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SeasonsService {

  constructor(private prisma: PrismaService) {}

  // get the sections that belong to one season
  async findSections(seasonId: number) {
    
    // check the season exists
    const season = await this.prisma.client.orm.public.Season
      .where({ id: seasonId })
      .first();

    if (!season) {
      throw new NotFoundException(`Season ${seasonId} not found`);
    }

    const sections = await this.prisma.client.orm.public.Section
      .where({ seasonId })
      .all();

    // put the sections in alphabetical order, then keep only the fields the screen needs
    return sections
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((section) => ({
        id: section.id,
        name: section.name,
      }));
  }
  
}