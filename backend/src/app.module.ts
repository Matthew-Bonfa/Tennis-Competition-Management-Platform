import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { MatchesModule } from './matches/matches.module.js';
import { SectionsModule } from './sections/sections.module.js';
import { CompetitionsModule } from './competitions/competitions.module.js';
import { TeamsModule } from './teams/teams.module.js';
import { SeasonsModule } from './seasons/seasons.module.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, MatchesModule, SectionsModule, TeamsModule, CompetitionsModule, SeasonsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
