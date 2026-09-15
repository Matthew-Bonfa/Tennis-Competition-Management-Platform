import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { MatchesModule } from './matches/matches.module.js';
import { SectionsModule } from './sections/sections.module.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, MatchesModule, SectionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
