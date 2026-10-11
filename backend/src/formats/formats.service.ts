import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class FormatsService {
  constructor(private prisma: PrismaService) {}

  // list formats (optionally only one association's), for dropdowns
  async findAll(associationId?: string) {
    let id = {};
    if (associationId){
      const id = {associationId};
    }

    const formats = await this.prisma.client.orm.public.Format
      .where(id)
      .all();

    return formats.map((format) => ({
      id: format.id,
      name: format.name,
    }));
  }
}