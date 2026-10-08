import { Module } from '@nestjs/common';
import { SectionsModule } from '../sections/sections.module.js';
import { TeamsService } from './teams.service.js';
import { TeamsController } from './teams.controller.js';

@Module({
  imports: [SectionsModule],
  controllers: [TeamsController],
  providers: [TeamsService],
})
export class TeamsModule {}
