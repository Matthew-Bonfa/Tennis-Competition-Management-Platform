import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeasonsService {

    constructor(private prisma: PrismaService) {}

    async findAll(competitionId?: string){
        const seasons = await this.prisma.client.orm.public.Season
        .where(competitionId ? { competitionId } : {})
        .all();
        return seasons
    }

}
