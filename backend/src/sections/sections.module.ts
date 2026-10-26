import { Module } from '@nestjs/common';
import { SectionsController } from './sections.controller.js';
import { SectionsService } from './sections.service.js';

@Module({
  controllers: [SectionsController],
  providers: [SectionsService],
  // TeamsService reads a team's win/loss record out of calculateLadder.
  exports: [SectionsService],
})
export class SectionsModule {}
