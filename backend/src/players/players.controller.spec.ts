import { Test, TestingModule } from '@nestjs/testing';
import { PlayersController } from './players.controller.js';
import { PlayersService } from './players.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('PlayersController', () => {
  let controller: PlayersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayersController],
      providers: [PlayersService, PrismaService],
    }).compile();

    controller = module.get<PlayersController>(PlayersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
