import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AssociationsService {

    // connect to database
    constructor(
        private prisma: PrismaService,
    ) {}

    //FOR ASSOCIATIONS PAGE
    // get all associations rows
    async findAll() {
        const associations = await this.prisma.client.orm.public.Association.all();
        return associations.map((association) => ({
            id: association.id,
            name: association.name,
        }));
    } 
    // get specific association row
    async findOne(id: string) {
        const association = await this.prisma.client.orm.public.Association
        .where({ id })
        .first();

        // if nothing was found, send back a proper "404 not found" error
        if (!association) {
            throw new NotFoundException(`Association ${id} not found`);
        }

        return {
            id: association.id,
            name: association.name,
        }
    }
}