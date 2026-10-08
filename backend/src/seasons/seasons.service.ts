import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSeasonDto } from './dto/create-season.dto.js';
import { UpdateSeasonDto } from './dto/update-season.dto.js';
import "temporal-polyfill/full/global";

const Temporal = (globalThis as any).Temporal;

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

    async create(createSeasonDto: CreateSeasonDto) {
    return this.prisma.client.orm.public.Season.create({
        name: createSeasonDto.name,
        competitionId: createSeasonDto.competitionId,
        startDate: Temporal.Instant.from(new Date(createSeasonDto.startDate).toISOString()),
        endDate: Temporal.Instant.from(new Date(createSeasonDto.endDate).toISOString()),
    });
    }

    async update(id: number, updateSeasonDto: UpdateSeasonDto) {
        // throws a 404 if the season doesn't exist
        await this.findOne(id);

        const data: any = {};
        if (updateSeasonDto.name !== undefined) {
            data.name = updateSeasonDto.name;
        }
        if (updateSeasonDto.startDate !== undefined) {
            data.startDate = Temporal.Instant.from(new Date(updateSeasonDto.startDate).toISOString());
        }
        if (updateSeasonDto.endDate !== undefined) {
            data.endDate = Temporal.Instant.from(new Date(updateSeasonDto.endDate).toISOString());
        }
        return this.prisma.client.orm.public.Season.where({ id }).update(data);
    }

}
