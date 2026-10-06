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
import { FixturesModule } from './fixtures/fixtures.module.js';
import { AssociationsModule } from './associations/associations.module.js';
import { ClubsModule } from './clubs/clubs.module.js';
import { PlayersModule } from './players/players.module.js';
import { AuthModule } from './auth/auth.module.js';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { RolesGuard } from './auth/guards/roles.guard.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    MatchesModule,
    SectionsModule,
    TeamsModule,
    CompetitionsModule,
    SeasonsModule,
    FixturesModule,
    AssociationsModule,
    ClubsModule,
    PlayersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Enforces JWT authentication on every route globally
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Verifies the valid user has the correct permissions
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
