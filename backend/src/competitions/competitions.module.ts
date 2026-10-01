import { Module } from '@nestjs/common';
import { CompetitionsController } from './competitions.controller.js';
import { CompetitionsService } from './competitions.service.js';
import { AssociationsModule } from '../associations/associations.module.js';
import { SeasonsModule } from '../seasons/seasons.module.js';

@Module({
    imports: [AssociationsModule, SeasonsModule],
    controllers: [CompetitionsController],
    providers: [CompetitionsService]
})
export class CompetitionsModule {}
