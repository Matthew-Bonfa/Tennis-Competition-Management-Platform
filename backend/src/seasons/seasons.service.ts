import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SeasonsService {

    constructor(private prisma: PrismaService) {}

    async findAll(competitionId?: string){
        const seasons = await this.prisma.client.orm.public.Season
        .where(competitionId ? { competitionId } : {})
        .all();
        return seasons
    }

    // not for specifc page, just to have (?)
    async findOne(id: number){

        const season = await this.prisma.client.orm.public.Season
            .where({ id })
            .first();

        if (!season){
            throw new NotFoundException(`Season ${id} not found`);
        }
        
        return season
    }

}
