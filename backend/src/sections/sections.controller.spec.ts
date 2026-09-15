import { Test, TestingModule } from '@nestjs/testing';
import { SectionsController } from './sections.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SectionsService } from './sections.service.js';

describe('SectionsController', () => {
  let controller: SectionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SectionsController],
      providers: [SectionsService, PrismaService],
    }).compile();

    controller = module.get<SectionsController>(SectionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
