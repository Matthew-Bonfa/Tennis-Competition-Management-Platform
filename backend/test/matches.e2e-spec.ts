import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Matches Feature (e2e)', () => {
  let app: INestApplication;

  // To store a uuid
  let savedMatchId: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/matches?sectionId=1 -> should return all matches for a section', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/matches?sectionId=1')
      .expect(200);

    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);

    // Verify data has correct typing
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        sectionId: 1,
        homeTeamId: expect.any(Number),
        awayTeamId: expect.any(Number),
        matchStatus: expect.any(String),
      }),
    );

    // uuid of our first match
    savedMatchId = response.body[0].id;
  });

  // Should return 404 for an invalid request
  it('GET /api/matches?sectionId=abc -> should return 400 Bad Request (ParseIntPipe check)', async () => {
    await request(app.getHttpServer())
      .get('/api/matches?sectionId=abc')
      .expect(400);
  });

  // Finds just one match using the id saved earlier
  it('GET /api/matches/:id -> should return a specific match with joined relational data', async () => {
    expect(savedMatchId).toBeDefined();

    const response = await request(app.getHttpServer())
      .get(`/api/matches/${savedMatchId}`)
      .expect(200);

    // Correctly formed data
    expect(response.body).toEqual(
      expect.objectContaining({
        id: savedMatchId,
        sectionId: 1,
        homeTeam: expect.any(Object),
        awayTeam: expect.any(Object),
      }),
    );
  });

  // Finds a seeded match of the given status in section 1
  async function findMatchByStatus(status: string) {
    const list = await request(app.getHttpServer())
      .get('/api/matches?sectionId=1')
      .expect(200);

    const match = list.body.find((m: { matchStatus: string }) => m.matchStatus === status);
    expect(match).toBeDefined();
    return match;
  }

  // The server stores the match winner; a completed match reports who won it
  it('GET /api/matches/:id -> a completed match should report its winning team', async () => {
    const completed = await findMatchByStatus('completed');

    const response = await request(app.getHttpServer())
      .get(`/api/matches/${completed.id}`)
      .expect(200);

    expect(response.body.winningTeamId).toBe(completed.homeTeamId);
    expect(response.body.disputeReason).toBeNull();
  });

  // No winner until a result has been entered and confirmed
  it('GET /api/matches/:id -> a scheduled match should have no winning team', async () => {
    const scheduled = await findMatchByStatus('scheduled');

    const response = await request(app.getHttpServer())
      .get(`/api/matches/${scheduled.id}`)
      .expect(200);

    expect(response.body.winningTeamId).toBeNull();
    expect(response.body.rubbers).toEqual([]);
  });

  // Rubbers come back in score-sheet order, each with its winner and scoreline
  it('GET /api/matches/:id -> a completed match should return its rubbers in order with winners and scorelines', async () => {
    const completed = await findMatchByStatus('completed');

    const response = await request(app.getHttpServer())
      .get(`/api/matches/${completed.id}`)
      .expect(200);

    const { rubbers } = response.body;
    expect(rubbers.map((r: { rubberNumber: number }) => r.rubberNumber)).toEqual([1, 2, 3]);
    expect(rubbers.map((r: { rubberType: string }) => r.rubberType)).toEqual(['singles', 'singles', 'doubles']);
    expect(rubbers.map((r: { winningTeamId: number }) => r.winningTeamId)).toEqual([
      completed.homeTeamId,
      completed.awayTeamId,
      completed.homeTeamId,
    ]);
    expect(rubbers.map((r: { scoreline: string }) => r.scoreline)).toEqual([
      '6-4 6-3',
      '3-6 5-7',
      '6-2 4-6 6-4',
    ]);
  });
});
