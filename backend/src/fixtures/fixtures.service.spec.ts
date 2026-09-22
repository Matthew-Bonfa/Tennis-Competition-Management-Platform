import { Test, TestingModule } from '@nestjs/testing'
import { FixturesService } from './fixtures.service.js'
import { PrismaService } from '../prisma/prisma.service.js'

describe('FixturesService', () => {
  let service: FixturesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FixturesService, PrismaService],
    }).compile();

    service = module.get<FixturesService>(FixturesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
