import { Test, TestingModule } from '@nestjs/testing';
import { CompetitionsController } from './competitions.controller.js';
import { CompetitionsService } from './competitions.service.js';
import { AssociationsService } from '../associations/associations.service.js';
import { SeasonsService } from '../seasons/seasons.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('CompetitionsController', () => {
  let controller: CompetitionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompetitionsController],
      providers: [CompetitionsService, AssociationsService, SeasonsService, PrismaService]
    }).compile();

    controller = module.get<CompetitionsController>(CompetitionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
