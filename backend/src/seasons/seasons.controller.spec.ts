import { Test, TestingModule } from '@nestjs/testing';
import { SeasonsController } from './seasons.controller.js';
import { SeasonsService } from './seasons.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('SeasonsController', () => {
  let controller: SeasonsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeasonsController],
      providers: [SeasonsService, PrismaService]
    }).compile();

    controller = module.get<SeasonsController>(SeasonsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
