import { Test, TestingModule } from '@nestjs/testing';
import { PlayersService } from './players.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('PlayersService', () => {
  let service: PlayersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlayersService, PrismaService],
    }).compile();

    service = module.get<PlayersService>(PlayersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
