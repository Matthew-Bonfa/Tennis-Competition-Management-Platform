import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { SectionsService } from '../sections/sections.service.js';
import { TeamsService } from './teams.service.js';

describe('TeamsService', () => {
  let service: TeamsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        PrismaService,
        // Stubbed rather than real: calculateLadder is the only method
        // TeamsService calls, and the real one needs a live database.
        { provide: SectionsService, useValue: { calculateLadder: vi.fn() } },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
