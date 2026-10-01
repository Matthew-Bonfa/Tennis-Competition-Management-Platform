import { Test, TestingModule } from '@nestjs/testing';
import { CompetitionsService } from './competitions.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('CompetitionsService', () => {
  let service: CompetitionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompetitionsService, PrismaService],
    }).compile();

    service = module.get<CompetitionsService>(CompetitionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
