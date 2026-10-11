import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class FormatsService {
  constructor(private prisma: PrismaService) {}

  // list formats (optionally only one association's), for dropdowns
  async findAll(associationId?: string) {
    const formats = await this.prisma.client.orm.public.Format
      .where(associationId ? { associationId } : {})
      .all();

    return formats.map((format) => ({
      id: format.id,
      name: format.name,
    }));
  }
}