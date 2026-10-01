import { Test, TestingModule } from '@nestjs/testing';
import { SectionsController } from './sections.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SectionsService } from './sections.service.js';
import type { LadderRow } from './types.js';
import type { Response } from 'express';

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

  describe('exportLadderCsv', () => {
    const ladderRow: LadderRow = {
      teamId: 1,
      teamName: 'Kilsyth 1',
      position: 1,
      matchesPlayed: 4,
      matchesWon: 3,
      matchesDrawn: 0,
      matchesLost: 1,
      rubbersWon: 10,
      rubbersLost: 6,
      setsWon: 20,
      setsLost: 12,
      gamesWon: 96,
      gamesLost: 80,
      percentage: 1.2,
      points: 6,
    };

    function fakeResponse(): Response {
      return { setHeader: vi.fn() } as unknown as Response;
    }

    it('sets CSV headers and returns a UTF-8 BOM-prefixed CSV body', async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [SectionsController],
        providers: [SectionsService, PrismaService],
      })
        .overrideProvider(SectionsService)
        .useValue({ calculateLadder: vi.fn().mockResolvedValue([ladderRow]) })
        .compile();

      const testController = module.get<SectionsController>(SectionsController);
      const res = fakeResponse();

      const body = await testController.exportLadderCsv(1, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="ladder-section-1.csv"');
      expect(body.startsWith('﻿')).toBe(true);
      expect(body).toContain('Position,Team,Played,Won,Drawn,Lost,Rubbers For,Rubbers Against,Sets For,Sets Against,Games For,Games Against,Percentage,Points');
      expect(body).toContain('Kilsyth 1');
    });
  });
});
