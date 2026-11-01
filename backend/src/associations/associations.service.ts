import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
      .include('contactPerson', (p) => p.select('id', 'firstName', 'lastName', 'email', 'phone'))
      .include('roles', (r) => r.include('person', (p) => p.select('id', 'firstName', 'lastName')))
      .first();

    if (!response) {
      throw new NotFoundException(`Association ${id} not found`);
    }
    return response;
  }


  async insertAssociation(data: {name: string, contactPersonId?: string, roles?: [{personId: string, role: string}]}){
    const response = await this.prisma.client.orm.public.Association.create({
      name: data.name,
      contactPersonId: data.contactPersonId,
    });


    if (data.roles){
      for (let i = 0; i < data.roles.length; i++){
        await this.prisma.client.orm.public.PersonRole.create({
          associationId: response.id,
          personId: data.roles[i].personId,
          role: data.roles[i].role,
        });
      }
    }

    return response;   // 201 created, but won't include the roles

  }

  async updateAssociation(id: string, data: {name: string, contactPersonId?: string | null, roles?: [{personId: string, role: string}]}){
    // if this id doesn't exist, getAssociation will throw the 404 for us
    await this.getAssociation(id);


    await this.prisma.client.orm.public.PersonRole.where({associationId: id}).deleteAll();

    if (data.roles){
      for (let i = 0; i < data.roles.length; i++){
        await this.prisma.client.orm.public.PersonRole.create({
          personId: data.roles[i].personId,
          role: data.roles[i].role,
          associationId: id,
        })
      }
    }
    

    return await this.prisma.client.orm.public.Association
      .where({id})
      .update({
        name: data.name,
        contactPersonId: data.contactPersonId,
      });
  }


}
