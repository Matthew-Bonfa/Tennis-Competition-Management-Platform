import { Module } from '@nestjs/common';
import { SeasonsService } from './seasons.service.js';
import { SeasonsController } from './seasons.controller.js';

@Module({
  providers: [SeasonsService],
  controllers: [SeasonsController],
  exports: [SeasonsService]
})
export class SeasonsModule {}