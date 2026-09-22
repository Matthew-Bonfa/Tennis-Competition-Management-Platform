import { Test, TestingModule } from '@nestjs/testing';
import { ClubsController } from './clubs.controller.js';
import { ClubsService } from './clubs.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('ClubsController', () => {
  let controller: ClubsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClubsController],
      providers: [ClubsService, PrismaService],
    }).compile();

    controller = module.get<ClubsController>(ClubsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
