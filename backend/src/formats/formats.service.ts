import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class FormatsService {
  constructor(private prisma: PrismaService) {}

  // list all formats, for dropdowns
  async findAll() {
    const formats = await this.prisma.client.orm.public.Format.all();

    return formats.map((format) => ({
      id: format.id,
      name: format.name,
    }));
  }
}