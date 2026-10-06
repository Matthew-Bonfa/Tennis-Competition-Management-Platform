import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AssociationsService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    const response = await this.prisma.client.orm.public.Association
      .orderBy((u) => u.name.asc())
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
      throw new NotFoundException(`Association ${id} not found`);
    }
    return response;
  }


  async insertAssociation(data: {name: string}){
    return await this.prisma.client.orm.public.Association.create(data);
  }

  async updateAssociation(id: string, data: {name: string}){
    try {
      return await this.prisma.client.orm.public.Association.where({id}).update(data);
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException(`Association with ID "${id}" not found`);
      }
      throw error;
    }
 
  }


}
