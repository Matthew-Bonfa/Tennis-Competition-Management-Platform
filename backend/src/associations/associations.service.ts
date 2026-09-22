import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AssociationsService {

    // connect to database
    constructor(private prisma: PrismaService) {}

    // get all associations rows
    async findAll() {
        const associations = await this.prisma.client.orm.public.Association.all();
        return associations
    }

    // get specific association row
    async findOne(id: string) {
        const association = await this.prisma.client.orm.public.Association
        .where({ id })
        .first();
        return association
    }

}