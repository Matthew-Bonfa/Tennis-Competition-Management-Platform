import { Test, TestingModule } from '@nestjs/testing';
import { SeasonsService } from './seasons.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('SeasonsService', () => {
  let service: SeasonsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SeasonsService, PrismaService],
    }).compile();

    service = module.get<SeasonsService>(SeasonsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
