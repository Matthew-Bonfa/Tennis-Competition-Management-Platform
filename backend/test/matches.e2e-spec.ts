import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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
    expect(response.body).toBeGreaterThan(0);

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
});
