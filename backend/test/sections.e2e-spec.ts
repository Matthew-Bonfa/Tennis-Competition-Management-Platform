import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Sections Feature (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let playerToken: string;

  const login = async (email: string) => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);
    return response.body.access_token as string;
  };

  // Setup
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');

    // Adds stricter formatting to tests
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);
    adminToken = await login('admin@tennis.com');
    // Jack is a PLAYER: signed in, but no say over an association's sections.
    playerToken = await login('volunteer@tennis.com');
  });

  // Close
  afterAll(async () => {
    await app.close();
  });

  // Test existance
  it('GET /api/sections/1/ladder -> should return the calculated ladder for Section 1', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/sections/1/ladder')
      .expect(200);

    // Checks for non empty array
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);

    // Ensures the types line up
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          teamId: expect.any(Number),
          teamName: expect.any(String),
          matchesPlayed: expect.any(Number),
          points: expect.any(Number),
        }),
      ]),
    );
  });

  // Ensures we should get a 404 if id does not exist
  it('GET /api/sections/9999/ladder -> should handle missing sections gracefully', async () => {
    await request(app.getHttpServer())
      .get('/api/sections/9999/ladder')
      .expect(404);
  });

  // CSV export
  it('GET /api/sections/1/ladder/export -> should return a CSV attachment', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/sections/1/ladder/export')
      .expect(200)
      .expect('Content-Type', /text\/csv/);

    expect(response.headers['content-disposition']).toBe(
      'attachment; filename="ladder-section-1.csv"',
    );

    const text = (response.text as string).replace(/^﻿/, '');
    const lines = text.split('\r\n');

    expect(lines[0]).toBe(
      'Position,Team,Played,Won,Drawn,Lost,Rubbers For,Rubbers Against,Sets For,Sets Against,Games For,Games Against,Percentage,Points',
    );

    const jsonResponse = await request(app.getHttpServer())
      .get('/api/sections/1/ladder')
      .expect(200);
    expect(lines.length).toBe(jsonResponse.body.length + 1);
  });

  it('GET /api/sections/9999/ladder/export -> should return 404 Not Found for non-existent section', async () => {
    await request(app.getHttpServer())
      .get('/api/sections/9999/ladder/export')
      .expect(404);
  });

  // A section is built and thrown away here rather than deleting one of the
  // seeded sections: the ladder tests above read Section 1, and the other
  // suites read both of them.
  describe('DELETE /api/sections/:id', () => {
    let sectionId: number;
    let homeTeamId: number;
    let awayTeamId: number;
    let matchId: string;
    let rubberId: number;
    let requestId: number;

    const del = (id: number | string, token?: string) => {
      const req = request(app.getHttpServer()).delete(`/api/sections/${id}`);
      return token ? req.set('Authorization', `Bearer ${token}`) : req;
    };

    beforeAll(async () => {
      // Borrow a real season, format, club and player off the seeded data, so
      // the throwaway section is built out of rows that are valid already.
      const teams = (await request(app.getHttpServer()).get('/api/teams').expect(200)).body;
      const kilsyth = teams.find((team: any) => team.name === 'Glen Waverley A');
      const ringwood = teams.find((team: any) => team.name === 'East Burwood A');
      expect(kilsyth).toBeDefined();
      expect(ringwood).toBeDefined();

      const section = await request(app.getHttpServer())
        .post('/api/sections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Section To Delete',
          seasonId: kilsyth.section.seasonId,
          formatId: kilsyth.section.formatId,
        })
        .expect(201);
      sectionId = section.body.id;

      const createTeam = async (clubId: string, name: string, personId: string) => {
        const response = await request(app.getHttpServer())
          .post('/api/teams')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ clubId, sectionId, name, players: [{ personId }] })
          .expect(201);
        return response.body.id as number;
      };

      homeTeamId = await createTeam(kilsyth.clubId, 'Section To Delete A', kilsyth.players[0].personId);
      awayTeamId = await createTeam(ringwood.clubId, 'Section To Delete B', ringwood.players[0].personId);

      // A played fixture with the full paper trail behind it. There is no
      // endpoint that creates a fixture, so the match itself is written here;
      // everything hanging off it is the shape a result entry leaves behind.
      const orm = prisma.client.orm.public;

      const match = await orm.Match.create({
        sectionId,
        homeTeamId,
        awayTeamId,
        roundNumber: 1,
        matchDate: Temporal.Instant.from('2026-11-07T13:00:00Z'),
        matchStatus: 'completed',
        winningTeamId: homeTeamId,
      });
      matchId = match.id;

      const rubber = await orm.Rubber.create({
        matchId,
        rubberNumber: 1,
        rubberType: 'singles',
        winningTeamId: homeTeamId,
        outcomeType: 'normal',
      });
      rubberId = rubber.id;

      await orm.RubberSet.create({ rubberId, setNumber: 1, homeGames: 6, awayGames: 4 });
      await orm.RubberSet.create({ rubberId, setNumber: 2, homeGames: 6, awayGames: 3 });
      await orm.RubberPlayer.create({ rubberId, teamId: homeTeamId, personId: kilsyth.players[0].personId });
      await orm.RubberPlayer.create({ rubberId, teamId: awayTeamId, personId: ringwood.players[0].personId });
      await orm.MatchResultEvent.create({
        matchId,
        eventType: 'entered',
        personId: kilsyth.players[0].personId,
      });

      // The registration request that produced the home team, so the delete
      // has a request to unlink rather than to remove.
      const teamRequest = await orm.TeamRequest.create({
        clubId: kilsyth.clubId,
        seasonId: kilsyth.section.seasonId,
        sectionComment: 'delete me along with the section',
        formatId: kilsyth.section.formatId,
        name: 'Section To Delete A',
        pending: false,
        teamId: homeTeamId,
      });
      requestId = teamRequest.id;
    });

    it('rejects a request with no token', async () => {
      await del(sectionId).expect(401);
    });

    it('rejects a player who is not an association admin', async () => {
      await del(sectionId, playerToken).expect(403);
    });

    it('returns 400 for a non-numeric id', async () => {
      await del('not-a-number', adminToken).expect(400);
    });

    it('returns 404 for a section that does not exist', async () => {
      await del(999999, adminToken).expect(404);
    });

    it('deletes the section and reports what went with it', async () => {
      const response = await del(sectionId, adminToken).expect(200);

      expect(response.body).toEqual({
        id: sectionId,
        name: 'Section To Delete',
        matchesDeleted: 1,
        rubbersDeleted: 1,
        teamsDeleted: 2,
      });

      const afterDelete = await request(app.getHttpServer())
        .get(`/api/sections/${sectionId}`)
        .expect(404);
      expect(afterDelete.body.message).toBe(`Section ${sectionId} not found`);
    });

    it('takes the fixtures, rubbers, sets, players and result events with it', async () => {
      const orm = prisma.client.orm.public;

      expect(await orm.Match.where({ sectionId }).first()).toBeNull();
      expect(await orm.Rubber.where({ matchId }).first()).toBeNull();
      expect(await orm.RubberSet.where({ rubberId }).all()).toEqual([]);
      expect(await orm.RubberPlayer.where({ rubberId }).all()).toEqual([]);
      expect(await orm.MatchResultEvent.where({ matchId }).all()).toEqual([]);
    });

    it('takes the teams entered into it, and their rosters, with it', async () => {
      const orm = prisma.client.orm.public;

      expect(await orm.Team.where({ id: homeTeamId }).first()).toBeNull();
      expect(await orm.Team.where({ id: awayTeamId }).first()).toBeNull();
      expect(await orm.TeamPlayer.where({ teamId: homeTeamId }).all()).toEqual([]);
      expect(await orm.TeamPlayer.where({ teamId: awayTeamId }).all()).toEqual([]);
    });

    it('keeps the registration request that produced a team, with its team link cleared', async () => {
      const teamRequest = await prisma.client.orm.public.TeamRequest.where({ id: requestId }).first();

      expect(teamRequest).not.toBeNull();
      expect(teamRequest!.name).toBe('Section To Delete A');
      expect(teamRequest!.teamId).toBeNull();
    });

    it('leaves every other section, team and fixture alone', async () => {
      const orm = prisma.client.orm.public;

      // Section 1 is the seeded section this file's ladder tests read.
      expect(await orm.Section.where({ id: 1 }).first()).not.toBeNull();
      expect(await orm.Team.where({ name: 'Glen Waverley A' }).first()).not.toBeNull();
      expect((await orm.Match.where({ sectionId: 1 }).all()).length).toBeGreaterThan(0);

      await request(app.getHttpServer()).get('/api/sections/1/ladder').expect(200);
    });

    it('returns 404 when the same section is deleted twice', async () => {
      await del(sectionId, adminToken).expect(404);
    });
  });
});
