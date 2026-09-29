import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
class AssociationsService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    const response = await this.prisma.client.orm.public.Association.select(
      'id',
      'name',
    )
      .orderBy((u) => u.name.desc())
      .all();

    return response;
  }

  async getAssociation(id: string) {
    const response = await this.prisma.client.orm.public.Association.where({
      id: id,
    })
      .include('contactPerson', (p) => p.select('id', 'firstName', 'lastName'))
      .first();

    if (!response) {
      throw new NotFoundException(`Club ${id} not found`);
    }
    return response;
  }
}

export default AssociationsService;
