import { Test, TestingModule } from '@nestjs/testing'
import { FixturesController } from './fixtures.controller.js'
import { FixturesService } from './fixtures.service.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { FixtureStatusFilter } from './types.js'
import type { Fixture } from './types.js'
import type { Response } from 'express'

describe('FixturesController', () => {
  let controller: FixturesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FixturesController],
      providers: [FixturesService, PrismaService],
    }).compile();

    controller = module.get<FixturesController>(FixturesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('exportCsv', () => {
    const fixture: Fixture = {
      matchId: 'match-1',
      sectionId: 1,
      roundNumber: 2,
      matchDate: '2026-06-13T09:00:00.000Z',
      location: 'Kilsyth',
      locationClubId: 'club-1',
      status: 'completed',
      homeTeam: { id: 1, name: 'Kilsyth 1', clubId: 'club-1', clubName: 'Kilsyth' },
      awayTeam: { id: 2, name: 'Ringwood 1', clubId: 'club-2', clubName: 'Ringwood' },
      result: { homeRubbersWon: 4, awayRubbersWon: 2, winner: 'home' },
    };

    function fakeResponse(): Response {
      return { setHeader: vi.fn() } as unknown as Response;
    }

    it('sets CSV headers and returns a UTF-8 BOM-prefixed CSV body', async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [FixturesController],
        providers: [FixturesService, PrismaService],
      })
        .overrideProvider(FixturesService)
        .useValue({ findAll: vi.fn().mockResolvedValue([fixture]) })
        .compile();

      const testController = module.get<FixturesController>(FixturesController);
      const res = fakeResponse();

      const body = await testController.exportCsv(undefined, 1, FixtureStatusFilter.all, undefined, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="fixtures-section-1-all.csv"');
      expect(body.startsWith('﻿')).toBe(true);
      expect(body).toContain('Round,Date,Time,Location,Status,Home Team,Away Team,Home Rubbers,Away Rubbers,Outcome,Section ID,Match ID');
      expect(body).toContain('Kilsyth 1');
    });
  });
});
